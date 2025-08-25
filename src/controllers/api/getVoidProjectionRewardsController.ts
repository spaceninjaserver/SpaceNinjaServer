import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { crackRelic } from "../../helpers/relicHelper.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IVoidTearParticipantInfo } from "../../types/requestTypes.ts";
import type { RequestHandler } from "express";

export const getVoidProjectionRewardsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString<IVoidProjectionRewardRequest>(String(req.body));

    if (data.ParticipantInfo.QualifiesForReward && !data.ParticipantInfo.HaveRewardResponse) {
        const inventory = await getInventory(accountId);
        await crackRelic(inventory, data.ParticipantInfo);
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
    VoidTier: string;
    DifficultyTier: number;
    VoidProjectionRemovalHash: string;
}

interface IVoidProjectionRewardResponse {
    CurrentWave: number;
    ParticipantInfo: IVoidTearParticipantInfo;
    DifficultyTier: number;
}
