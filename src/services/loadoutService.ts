import { Loadout } from "@/src/models/inventoryModels/loadoutModel";
import { logger } from "@/src/utils/logger";
import { ILoadoutDatabase } from "../types/saveLoadoutTypes";

export const getLoadout = async (accountId: string): Promise<ILoadoutDatabase> => {
    const loadout = await Loadout.findOne({ loadoutOwnerId: accountId });

    if (!loadout) {
        logger.error(`loadout not found for account ${accountId}`);
        throw new Error("loadout not found");
    }

    return loadout.toJSON();
};
