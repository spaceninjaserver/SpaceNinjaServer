import { Account } from "@/src/models/loginModel";
import { createInventory } from "@/src/services/inventoryService";
import { IDatabaseAccount } from "@/src/types/loginTypes";
import { createShip } from "./shipService";
import { Types } from "mongoose";
import { Loadout } from "@/src/models/inventoryModels/loadoutModel";
import { PersonalRooms } from "@/src/models/shipModel";
import new_personal_rooms from "@/static/fixed_responses/personalRooms.json";

const isCorrectPassword = (requestPassword: string, databasePassword: string): boolean => {
    return requestPassword === databasePassword;
};

const createAccount = async (accountData: IDatabaseAccount) => {
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

export { isCorrectPassword, createAccount };

export const createLoadout = async (accountId: Types.ObjectId) => {
    const loadout = new Loadout({ loadoutOwnerId: accountId });
    const savedLoadout = await loadout.save();
    return savedLoadout._id;
};

export const createPersonalRooms = async (accountId: Types.ObjectId, shipId: Types.ObjectId) => {
    const personalRooms = new PersonalRooms({
        ...new_personal_rooms,
        personalRoomsOwnerId: accountId,
        activeShipId: shipId
    });
    await personalRooms.save();
};
