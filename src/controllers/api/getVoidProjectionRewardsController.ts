import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addMiscItems, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { handleStoreItemAcquisition } from "@/src/services/purchaseService";
import { getRandomWeightedReward2 } from "@/src/services/rngService";
import { ITypeCount } from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";
import { ExportRelics, ExportRewards, TRarity } from "warframe-public-export-plus";

export const getVoidProjectionRewardsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString(String(req.body)) as IVoidProjectionRewardRequest;
    const response: IVoidProjectionRewardResponse = {
        CurrentWave: data.CurrentWave,
        ParticipantInfo: data.ParticipantInfo,
        DifficultyTier: data.DifficultyTier
    };
    if (data.ParticipantInfo.QualifiesForReward) {
        const relic = ExportRelics[data.ParticipantInfo.VoidProjection];
        const weights = refinementToWeights[relic.quality];
        logger.debug(`opening a relic of quality ${relic.quality}; rarity weights are`, weights);
        const reward = getRandomWeightedReward2(
            ExportRewards[relic.rewardManifest][0] as { type: string; itemCount: number; rarity: TRarity }[], // rarity is nullable in PE+ typings, but always present for relics
            weights
        )!;
        logger.debug(`relic rolled`, reward);
        response.ParticipantInfo.Reward = reward.type;

        // Remove relic
        const inventory = await getInventory(accountId);
        addMiscItems(inventory, [
            {
                ItemType: data.ParticipantInfo.VoidProjection,
                ItemCount: -1
            }
        ]);
        await inventory.save();

        // Give reward
        await handleStoreItemAcquisition(reward.type, accountId, reward.itemCount);
    }
    res.json(response);
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

interface IVoidProjectionRewardRequest {
    CurrentWave: number;
    ParticipantInfo: IParticipantInfo;
    VoidTier: string;
    DifficultyTier: number;
    VoidProjectionRemovalHash: string;
}

interface IVoidProjectionRewardResponse {
    CurrentWave: number;
    ParticipantInfo: IParticipantInfo;
    DifficultyTier: number;
}

interface IParticipantInfo {
    AccountId: string;
    Name: string;
    ChosenRewardOwner: string;
    MissionHash: string;
    VoidProjection: string;
    Reward: string;
    QualifiesForReward: boolean;
    HaveRewardResponse: boolean;
    RewardsMultiplier: number;
    RewardProjection: string;
    HardModeReward: ITypeCount;
}
