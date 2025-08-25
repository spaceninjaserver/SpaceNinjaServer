import type { TLoadoutDatabaseDocument } from "../models/inventoryModels/loadoutModel.ts";
import { Loadout } from "../models/inventoryModels/loadoutModel.ts";

export const getLoadout = async (accountId: string): Promise<TLoadoutDatabaseDocument> => {
    const loadout = await Loadout.findOne({ loadoutOwnerId: accountId });

    if (!loadout) {
        throw new Error(`loadout not found for account ${accountId}`);
    }

    return loadout;
};
