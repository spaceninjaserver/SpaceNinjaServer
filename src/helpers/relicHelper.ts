import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { IVoidTearParticipantInfo } from "@/src/types/requestTypes";
import { ExportRelics, ExportRewards, TRarity } from "warframe-public-export-plus";
import { getRandomWeightedReward2 } from "@/src/services/rngService";
import { logger } from "@/src/utils/logger";
import { addMiscItems } from "@/src/services/inventoryService";
import { handleStoreItemAcquisition } from "@/src/services/purchaseService";

export const crackRelic = async (
    inventory: TInventoryDatabaseDocument,
    participant: IVoidTearParticipantInfo
): Promise<void> => {
    const relic = ExportRelics[participant.VoidProjection];
    const weights = refinementToWeights[relic.quality];
    logger.debug(`opening a relic of quality ${relic.quality}; rarity weights are`, weights);
    const reward = getRandomWeightedReward2(
        ExportRewards[relic.rewardManifest][0] as { type: string; itemCount: number; rarity: TRarity }[], // rarity is nullable in PE+ typings, but always present for relics
        weights
    )!;
    logger.debug(`relic rolled`, reward);
    participant.Reward = reward.type;

    // Remove relic
    addMiscItems(inventory, [
        {
            ItemType: participant.VoidProjection,
            ItemCount: -1
        }
    ]);

    // Give reward
    await handleStoreItemAcquisition(reward.type, inventory, reward.itemCount);
};

const refinementToWeights = {
    VPQ_BRONZE: {
        COMMON: 0.76,
        UNCOMMON: 0.22,
        RARE: 0.02,
        LEGENDARY: 0
    },
    VPQ_SILVER: {
        COMMON: 0.7,
        UNCOMMON: 0.26,
        RARE: 0.04,
        LEGENDARY: 0
    },
    VPQ_GOLD: {
        COMMON: 0.6,
        UNCOMMON: 0.34,
        RARE: 0.06,
        LEGENDARY: 0
    },
    VPQ_PLATINUM: {
        COMMON: 0.5,
        UNCOMMON: 0.4,
        RARE: 0.1,
        LEGENDARY: 0
    }
};
