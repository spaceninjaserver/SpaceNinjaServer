import type { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel.ts";
import type { IVoidTearParticipantInfo, IVoidTearWaveInfo } from "../types/requestTypes.ts";
import type { TRarity } from "warframe-public-export-plus";
import { ExportRelics, ExportRewards } from "warframe-public-export-plus";
import type { IRngResult } from "../services/rngService.ts";
import { getRandomWeightedReward } from "../services/rngService.ts";
import { logger } from "../utils/logger.ts";
import { addItem, addMiscItems, combineInventoryChanges } from "../services/inventoryService.ts";
import type { IInventoryChanges } from "../types/purchaseTypes.ts";
import type { ITypeCount } from "../types/commonTypes.ts";
import { fromStoreItem } from "../services/itemDataService.ts";

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
    if (inventory.relicRewardItemCountMultiplier && inventory.relicRewardItemCountMultiplier != 1) {
        reward = {
            ...reward,
            itemCount: reward.itemCount * inventory.relicRewardItemCountMultiplier
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
    combineInventoryChanges(inventoryChanges, await addItem(inventory, fromStoreItem(reward.type), reward.itemCount));

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

const getTypeCountForParticiantReward = (participant: IVoidTearParticipantInfo): ITypeCount => {
    const relic = ExportRelics[participant.VoidProjection];
    const reward = ExportRewards[relic.rewardManifest][0].find(x => x.type == participant.Reward)!;
    return {
        ItemType: reward.type,
        ItemCount: reward.itemCount
    };
};

export const ensureRelicRewardIsCorrect = async (
    inventory: TInventoryDatabaseDocument,
    wi: IVoidTearWaveInfo
): Promise<void> => {
    if (inventory.MissionRelicRewards && inventory.MissionRelicRewards.length >= wi.Wave) {
        const userParticipantInfo = wi.Participants.find(x => inventory.accountOwnerId.equals(x.AccountId))!;
        const userReward = inventory.MissionRelicRewards[wi.Wave - 1];
        if (userParticipantInfo.ChosenRewardOwner) {
            const chosenParticipantInfo = wi.Participants.find(
                x => x.AccountId == userParticipantInfo.ChosenRewardOwner
            )!;
            const chosenReward = getTypeCountForParticiantReward(chosenParticipantInfo);
            if (chosenReward.ItemType != userReward.ItemType || chosenReward.ItemCount != userReward.ItemCount) {
                logger.debug(`fixing up wave ${wi.Wave} reward for ${inventory.accountOwnerId.toString()}`, {
                    toRemove: userReward,
                    toAdd: chosenReward
                });
                await addItem(inventory, fromStoreItem(userReward.ItemType), userReward.ItemCount * -1);
                await addItem(inventory, fromStoreItem(chosenReward.ItemType), chosenReward.ItemCount);
                inventory.MissionRelicRewards[wi.Wave - 1] = chosenReward;
            }
        }
    }
};
