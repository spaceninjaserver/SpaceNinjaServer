import { Account } from "@/src/models/loginModel";
import { createInventory } from "@/src/services/inventoryService";
import { IDatabaseAccount, IDatabaseAccountJson } from "@/src/types/loginTypes";
import { createShip } from "./shipService";
import { Document, Types } from "mongoose";
import { Loadout } from "@/src/models/inventoryModels/loadoutModel";
import { PersonalRooms } from "@/src/models/personalRoomsModel";
import new_personal_rooms from "@/static/fixed_responses/personalRooms.json";
import { Request } from "express";
import { config } from "@/src/services/configService";

export const isCorrectPassword = (requestPassword: string, databasePassword: string): boolean => {
    return requestPassword === databasePassword;
};

export const isNameTaken = async (name: string): Promise<boolean> => {
    return !!(await Account.findOne({ DisplayName: name }));
};

export const createAccount = async (accountData: IDatabaseAccount): Promise<IDatabaseAccountJson> => {
    const account = new Account(accountData);
    try {
        await account.save();
        const loadoutId = await createLoadout(account._id);
        const shipId = await createShip(account._id);
        await createInventory(account._id, { loadOutPresetId: loadoutId, ship: shipId });
        await createPersonalRooms(account._id, shipId);
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
        ...new_personal_rooms,
        personalRoomsOwnerId: accountId,
        activeShipId: shipId
    });
    await personalRooms.save();
};

// eslint-disable-next-line @typescript-eslint/ban-types
type TAccountDocument = Document<unknown, {}, IDatabaseAccountJson> &
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
    return (await getAccountForRequest(req))._id.toString();
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
