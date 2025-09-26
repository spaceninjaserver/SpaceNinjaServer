import type { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel.ts";
import type { IVoidTearParticipantInfo } from "../types/requestTypes.ts";
import type { TRarity } from "warframe-public-export-plus";
import { ExportRelics, ExportRewards } from "warframe-public-export-plus";
import type { IRngResult } from "../services/rngService.ts";
import { getRandomWeightedReward } from "../services/rngService.ts";
import { logger } from "../utils/logger.ts";
import { addMiscItems, combineInventoryChanges } from "../services/inventoryService.ts";
import { handleStoreItemAcquisition } from "../services/purchaseService.ts";
import type { IInventoryChanges } from "../types/purchaseTypes.ts";
import { config } from "../services/configService.ts";

export const crackRelic = async (
    inventory: TInventoryDatabaseDocument,
    participant: IVoidTearParticipantInfo,
    inventoryChanges: IInventoryChanges = {}
): Promise<IRngResult> => {
    const relic = ExportRelics[participant.VoidProjection];
    let weights = refinementToWeights[relic.quality];
    if (relic.quality == "VPQ_SILVER" && inventory.exceptionalRelicsAlwaysGiveBronzeReward) {
        weights = { COMMON: 1, UNCOMMON: 0, RARE: 0, LEGENDARY: 0 };
    } else if (relic.quality == "VPQ_GOLD" && inventory.flawlessRelicsAlwaysGiveSilverReward) {
        weights = { COMMON: 0, UNCOMMON: 1, RARE: 0, LEGENDARY: 0 };
    } else if (relic.quality == "VPQ_PLATINUM" && inventory.radiantRelicsAlwaysGiveGoldReward) {
        weights = { COMMON: 0, UNCOMMON: 0, RARE: 1, LEGENDARY: 0 };
    }
    logger.debug(`opening a relic of quality ${relic.quality}; rarity weights are`, weights);
    let reward = getRandomWeightedReward(
        ExportRewards[relic.rewardManifest][0] as { type: string; itemCount: number; rarity: TRarity }[], // rarity is nullable in PE+ typings, but always present for relics
        weights
    )!;
    if (config.relicRewardItemCountMultiplier !== undefined && (config.relicRewardItemCountMultiplier ?? 1) != 1) {
        reward = {
            ...reward,
            itemCount: reward.itemCount * config.relicRewardItemCountMultiplier
        };
    }
    logger.debug(`relic rolled`, reward);
    participant.Reward = reward.type;

    // Remove relic
    const miscItemChanges = [
        {
            ItemType: participant.VoidProjection,
            ItemCount: -1
        }
    ];
    addMiscItems(inventory, miscItemChanges);
    combineInventoryChanges(inventoryChanges, { MiscItems: miscItemChanges });

    // Give reward
    combineInventoryChanges(
        inventoryChanges,
        (await handleStoreItemAcquisition(reward.type, inventory, reward.itemCount)).InventoryChanges
    );

    // Client has picked its own reward (for lack of choice)
    participant.ChosenRewardOwner = participant.AccountId;

    return reward;
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
