import { Account } from "@/src/models/loginModel";
import { createInventory } from "@/src/services/inventoryService";
import { IDatabaseAccountJson, IDatabaseAccountRequiredFields } from "@/src/types/loginTypes";
import { createShip } from "./shipService";
import { Document, Types } from "mongoose";
import { Loadout } from "@/src/models/inventoryModels/loadoutModel";
import { PersonalRooms } from "@/src/models/personalRoomsModel";
import { Request } from "express";
import { config } from "@/src/services/configService";
import { createStats } from "@/src/services/statsService";
import crc32 from "crc-32";

export const isCorrectPassword = (requestPassword: string, databasePassword: string): boolean => {
    return requestPassword === databasePassword;
};

export const isNameTaken = async (name: string): Promise<boolean> => {
    return !!(await Account.findOne({ DisplayName: name }));
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

// eslint-disable-next-line @typescript-eslint/ban-types
export type TAccountDocument = Document<unknown, {}, IDatabaseAccountJson> &
    IDatabaseAccountJson & { _id: Types.ObjectId; __v: number };

export const getAccountForRequest = async (req: Request): Promise<TAccountDocument> => {
    if (!req.query.accountId) {
        throw new Error("Request is missing accountId parameter");
    }
    if (!req.query.nonce || parseInt(req.query.nonce as string) === 0) {
        throw new Error("Request is missing nonce parameter");
    }
    const account = await Account.findOne({
        _id: req.query.accountId,
        Nonce: req.query.nonce
    });
    if (!account) {
        throw new Error("Invalid accountId-nonce pair");
    }
    return account;
};

export const getAccountIdForRequest = async (req: Request): Promise<string> => {
    const account = await getAccountForRequest(req);
    if (account.Dropped && req.query.ct) {
        account.Dropped = undefined;
        await account.save();
    }
    return account._id.toString();
};

export const isAdministrator = (account: TAccountDocument): boolean => {
    if (!config.administratorNames) {
        return false;
    }
    if (typeof config.administratorNames == "string") {
        return config.administratorNames == account.DisplayName;
    }
    return !!config.administratorNames.find(x => x == account.DisplayName);
};

const platform_magics = [753, 639, 247, 37, 60];
export const getSuffixedName = (account: TAccountDocument): string => {
    const name = account.DisplayName;
    const platformId = 0;
    const suffix = ((crc32.str(name.toLowerCase() + "595") >>> 0) + platform_magics[platformId]) % 1000;
    return name + "#" + suffix.toString().padStart(3, "0");
};
