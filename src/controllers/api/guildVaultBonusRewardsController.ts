import type { RequestHandler } from "express";
import { logger } from "../../utils/logger.ts";
import type { IWeekGuildVaultBonusReward } from "../../types/inventoryTypes/inventoryTypes.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { combineInventoryChanges, getInventory, getInventory2 } from "../../services/inventoryService.ts";
import { createWeeklyGuildVaultBonus } from "../../services/guildService.ts";
import { handleStoreItemAcquisition } from "../../services/purchaseService.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";

export const guildVaultBonusRewardsController: RequestHandler = async (req, res) => {
    if (req.query.gvbMode == "r") {
        const accountId = await getAccountIdForRequest(req);
        const payload = JSON.parse(String(req.body)) as IRollGuildVaultBonusRequest;

        const inventory = await getInventory2(accountId, "WeeklyGuildVaultBonusInfo");
        const weeklyBonus = { ...createWeeklyGuildVaultBonus(payload.WeekCount), Progress: 0 };

        inventory.WeeklyGuildVaultBonusInfo = [weeklyBonus]; // TODO: Probably should not replace the entire array if there were unclaimed rewards or something?
        await inventory.save();

        res.json({
            NewRewards: weeklyBonus.Rewards,
            BonusRegion: weeklyBonus.BonusRegion
        } satisfies IRollGuildVaultBonusResponse);
    } else if (req.query.gvbMode == "c") {
        // The client sends this by itself when the clan screen is opened and a reward has been reached but not claimed.
        const accountId = await getAccountIdForRequest(req);
        const payload = JSON.parse(String(req.body)) as IClaimGuildVaultBonusRequest;

        const inventory = await getInventory(accountId, undefined);
        const weeklyBonus = Array.isArray(inventory.WeeklyGuildVaultBonusInfo)
            ? inventory.WeeklyGuildVaultBonusInfo.find(x => x.WeekCount == payload.WeekCount)
            : undefined;
        const inventoryChanges: IInventoryChanges = {};
        const rewardIndicesClaimed: number[] = [];
        if (weeklyBonus) {
            for (let i = 0; i != weeklyBonus.Rewards.length; ++i) {
                const reward = weeklyBonus.Rewards[i];
                if (!reward.RewardClaimed && (weeklyBonus.Progress ?? 0) >= reward.PointThreshold) {
                    reward.RewardClaimed = true;
                    rewardIndicesClaimed.push(i);
                    combineInventoryChanges(
                        inventoryChanges,
                        (await handleStoreItemAcquisition(reward.Reward, inventory, reward.ItemCount, undefined, true))
                            .InventoryChanges
                    );
                }
            }
            await inventory.save();
        }

        res.json({
            InventoryChanges: inventoryChanges,
            RewardIndicesClaimed: rewardIndicesClaimed
        } satisfies IClaimGuildVaultBonusResponse);
    } else {
        logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
        throw new Error(`unexpected guildVaultBonusRewards mode: ${req.query.gvbMode as string}`);
    }
};

interface IRollGuildVaultBonusRequest {
    WeekCount: number;
}
interface IRollGuildVaultBonusResponse {
    NewRewards: IWeekGuildVaultBonusReward[];
    BonusRegion: string;
}

interface IClaimGuildVaultBonusRequest {
    WeekCount: number;
}
interface IClaimGuildVaultBonusResponse {
    InventoryChanges: IInventoryChanges;
    RewardIndicesClaimed: number[]; // The client marks these rewards as claimed and shows them.
}
