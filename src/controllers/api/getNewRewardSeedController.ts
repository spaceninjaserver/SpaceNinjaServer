import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { generateRewardSeed } from "../../services/rngService.ts";
import type { RequestHandler } from "express";

export const getNewRewardSeedController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);

    const rewardSeed = generateRewardSeed();
    await Inventory.updateOne(
        {
            accountOwnerId: accountId
        },
        {
            RewardSeed: rewardSeed
        }
    );
    res.json({ rewardSeed: rewardSeed });
};
