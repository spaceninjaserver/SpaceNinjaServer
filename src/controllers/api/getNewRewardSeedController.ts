import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { generateRewardSeed } from "@/src/services/rngService";
import { RequestHandler } from "express";

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
