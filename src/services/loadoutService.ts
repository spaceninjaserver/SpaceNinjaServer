import { Loadout, TLoadoutDatabaseDocument } from "@/src/models/inventoryModels/loadoutModel";

export const getLoadout = async (accountId: string): Promise<TLoadoutDatabaseDocument> => {
    const loadout = await Loadout.findOne({ loadoutOwnerId: accountId });

    if (!loadout) {
        throw new Error(`loadout not found for account ${accountId}`);
    }

    return loadout;
};
