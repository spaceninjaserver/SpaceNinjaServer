import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { crackRelic, ensureRelicRewardIsCorrect } from "../../helpers/relicHelper.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IVoidTearParticipantInfo, IVoidTearWaveInfo } from "../../types/requestTypes.ts";
import type { RequestHandler } from "express";
import { logger } from "../../utils/logger.ts";

export const getVoidProjectionRewardsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString<IVoidProjectionRewardRequest>(String(req.body));
    logger.debug(`getVoidProjectionRewards request:`, data);

    if (data.ParticipantInfo.QualifiesForReward && !data.ParticipantInfo.HaveRewardResponse) {
        const inventory = await getInventory(accountId, undefined);
        const reward = await crackRelic(inventory, data.ParticipantInfo);
        if (!inventory.MissionRelicRewards || inventory.MissionRelicRewards.length >= data.CurrentWave) {
            inventory.MissionRelicRewards = [];
        }
        inventory.MissionRelicRewards.push({ ItemType: reward.type, ItemCount: reward.itemCount });
        if (data.VoidTearParticipantsPrevWave) {
            await ensureRelicRewardIsCorrect(inventory, data.VoidTearParticipantsPrevWave);
        }
        await inventory.save();
    }

    const response: IVoidProjectionRewardResponse = {
        CurrentWave: data.CurrentWave,
        ParticipantInfo: data.ParticipantInfo,
        DifficultyTier: data.DifficultyTier
    };
    res.json(response);
};

interface IVoidProjectionRewardRequest {
    CurrentWave: number;
    ParticipantInfo: IVoidTearParticipantInfo;
    VoidTearParticipantsPrevWave?: IVoidTearWaveInfo;
    VoidTier: string;
    DifficultyTier: number;
    VoidProjectionRemovalHash: string;
}

interface IVoidProjectionRewardResponse {
    CurrentWave: number;
    ParticipantInfo: IVoidTearParticipantInfo;
    DifficultyTier: number;
}
