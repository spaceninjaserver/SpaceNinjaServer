import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { generateRewardSeed } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";

export const getNewRewardSeedController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);

    const rewardSeed = generateRewardSeed();
    logger.debug(`generated new reward seed: ${rewardSeed}`);
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
