import { Loadout } from "@/src/models/inventoryModels/loadoutModel";
import { logger } from "@/src/utils/logger";

export const getLoadout = async (accountId: string) => {
    const loadout = await Loadout.findOne({ loadoutOwnerId: accountId });

    if (!loadout) {
        logger.error(`loadout not found for account ${accountId}`);
        throw new Error("loadout not found");
    }

    return loadout;
};
