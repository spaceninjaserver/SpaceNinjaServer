import { Account } from "@/src/models/loginModel";
import { createInventory } from "@/src/services/inventoryService";
import type { IDatabaseAccountJson, IDatabaseAccountRequiredFields } from "@/src/types/loginTypes";
import { createShip } from "@/src/services/shipService";
import type { Document, Types } from "mongoose";
import { Loadout } from "@/src/models/inventoryModels/loadoutModel";
import { PersonalRooms } from "@/src/models/personalRoomsModel";
import type { Request } from "express";
import { config } from "@/src/services/configService";
import { createStats } from "@/src/services/statsService";
import crc32 from "crc-32";

export const isCorrectPassword = (requestPassword: string, databasePassword: string): boolean => {
    return requestPassword === databasePassword;
};

export const isNameTaken = async (name: string): Promise<boolean> => {
    return !!(await Account.findOne({ DisplayName: name }));
};

export const createNonce = (): number => {
    return Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
};

export const getUsernameFromEmail = async (email: string): Promise<string> => {
    const nameFromEmail = email.substring(0, email.indexOf("@"));
    let name = nameFromEmail || email.substring(1) || "SpaceNinja";
    if (await isNameTaken(name)) {
        let suffix = 0;
        do {
            ++suffix;
            name = nameFromEmail + suffix;
        } while (await isNameTaken(name));
    }
    return name;
};

export const createAccount = async (accountData: IDatabaseAccountRequiredFields): Promise<IDatabaseAccountJson> => {
    const account = new Account(accountData);
    try {
        await account.save();
        const loadoutId = await createLoadout(account._id);
        const shipId = await createShip(account._id);
        await createInventory(account._id, { loadOutPresetId: loadoutId, ship: shipId });
        await createPersonalRooms(account._id, shipId);
        await createStats(account._id.toString());
        return account.toJSON();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("error creating account that is not of instance Error");
    }
};

export const createLoadout = async (accountId: Types.ObjectId): Promise<Types.ObjectId> => {
    const loadout = new Loadout({ loadoutOwnerId: accountId });
    const savedLoadout = await loadout.save();
    return savedLoadout._id;
};

export const createPersonalRooms = async (accountId: Types.ObjectId, shipId: Types.ObjectId): Promise<void> => {
    const personalRooms = new PersonalRooms({
        personalRoomsOwnerId: accountId,
        activeShipId: shipId
    });
    if (config.skipTutorial) {
        // unlocked during Vor's Prize
        const defaultFeatures = [
            "/Lotus/Types/Items/ShipFeatureItems/MercuryNavigationFeatureItem",
            "/Lotus/Types/Items/ShipFeatureItems/ArsenalFeatureItem",
            "/Lotus/Types/Items/ShipFeatureItems/SocialMenuFeatureItem",
            "/Lotus/Types/Items/ShipFeatureItems/FoundryFeatureItem",
            "/Lotus/Types/Items/ShipFeatureItems/ModsFeatureItem"
        ];
        personalRooms.Ship.Features.push(...defaultFeatures);
    }
    await personalRooms.save();
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TAccountDocument = Document<unknown, {}, IDatabaseAccountJson> &
    IDatabaseAccountJson & { _id: Types.ObjectId; __v: number };

export const getAccountForRequest = async (req: Request): Promise<TAccountDocument> => {
    if (!req.query.accountId) {
        throw new Error("Request is missing accountId parameter");
    }
    const nonce: number = parseInt(req.query.nonce as string);
    if (!nonce) {
        throw new Error("Request is missing nonce parameter");
    }

    const account = await Account.findById(req.query.accountId as string);
    if (!account || account.Nonce != nonce) {
        throw new Error("Invalid accountId-nonce pair");
    }
    if (account.Dropped && req.query.ct) {
        account.Dropped = undefined;
        await account.save();
    }
    return account;
};

export const getAccountIdForRequest = async (req: Request): Promise<string> => {
    return (await getAccountForRequest(req))._id.toString();
};

export const isAdministrator = (account: TAccountDocument): boolean => {
    return config.administratorNames?.indexOf(account.DisplayName) != -1;
};

const platform_magics = [753, 639, 247, 37, 60];
export const getSuffixedName = (account: TAccountDocument): string => {
    const name = account.DisplayName;
    const platformId = 0;
    const suffix = ((crc32.str(name.toLowerCase() + "595") >>> 0) + platform_magics[platformId]) % 1000;
    return name + "#" + suffix.toString().padStart(3, "0");
};

export const getAccountFromSuffixedName = (name: string): Promise<TAccountDocument | null> => {
    return Account.findOne({ DisplayName: name.split("#")[0] });
};
