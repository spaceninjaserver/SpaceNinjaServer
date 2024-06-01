import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory, addMiscItems } from "@/src/services/inventoryService";
import { IMiscItem, TFocusPolarity } from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";
import baseFocusPointCosts from "@/static/json/baseFocusPointCosts.json";

export const focusController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    switch (req.query.op) {
        default:
            logger.error("Unhandled focus op type: " + req.query.op);
            logger.debug(req.body.toString());
            res.end();
            break;
        case FocusOperation.UnlockWay: {
            const focusType = (JSON.parse(req.body.toString()) as IWayRequest).FocusType;
            const focusPolarity = focusTypeToPolarity(focusType);
            const inventory = await getInventory(accountId);
            const cost = inventory.FocusAbility ? 50_000 : 0;
            inventory.FocusAbility ??= focusType;
            inventory.FocusUpgrades.push({ ItemType: focusType });
            if (inventory.FocusXP) {
                inventory.FocusXP[focusPolarity] -= cost;
            }
            await inventory.save();
            res.json({
                FocusUpgrade: { ItemType: focusType },
                FocusPointCosts: { [focusPolarity]: cost }
            });
            break;
        }
        case FocusOperation.ActivateWay: {
            const focusType = (JSON.parse(req.body.toString()) as IWayRequest).FocusType;
            const inventory = await getInventory(accountId);
            inventory.FocusAbility = focusType;
            await inventory.save();
            res.end();
            break;
        }
        case FocusOperation.UnlockUpgrade: {
            const request = JSON.parse(req.body.toString()) as IUnlockUpgradeRequest;
            const focusPolarity = focusTypeToPolarity(request.FocusTypes[0]);
            const inventory = await getInventory(accountId);
            let cost = 0;
            for (const focusType of request.FocusTypes) {
                cost += baseFocusPointCosts[focusType as keyof typeof baseFocusPointCosts];
                inventory.FocusUpgrades.push({ ItemType: focusType, Level: 0 });
            }
            inventory.FocusXP[focusPolarity] -= cost;
            await inventory.save();
            res.json({
                FocusTypes: request.FocusTypes,
                FocusPointCosts: { [focusPolarity]: cost }
            });
            break;
        }
        case FocusOperation.LevelUpUpgrade: {
            const request = JSON.parse(req.body.toString()) as ILevelUpUpgradeRequest;
            const focusPolarity = focusTypeToPolarity(request.FocusInfos[0].ItemType);
            const inventory = await getInventory(accountId);
            let cost = 0;
            for (const focusUpgrade of request.FocusInfos) {
                cost += focusUpgrade.FocusXpCost;
                const focusUpgradeDb = inventory.FocusUpgrades.find(entry => entry.ItemType == focusUpgrade.ItemType)!;
                focusUpgradeDb.Level = focusUpgrade.Level;
                if (focusUpgrade.IsUniversal) {
                    focusUpgradeDb.IsUniversal = true;
                }
            }
            inventory.FocusXP[focusPolarity] -= cost;
            await inventory.save();
            res.json({
                FocusInfos: request.FocusInfos,
                FocusPointCosts: { [focusPolarity]: cost }
            });
            break;
        }
        case FocusOperation.ConvertShard: {
            const request = JSON.parse(req.body.toString()) as IConvertShardRequest;
            // Tally XP
            let xp = 0;
            for (const shard of request.Shards) {
                xp += shardValues[shard.ItemType as keyof typeof shardValues] * shard.ItemCount;
            }
            // Send response
            res.json({
                FocusPointGains: {
                    [request.Polarity]: xp
                },
                MiscItemCosts: request.Shards
            });
            // Commit added XP and removed shards to DB
            for (const shard of request.Shards) {
                shard.ItemCount *= -1;
            }
            const inventory = await getInventory(accountId);
            inventory.FocusXP ??= { AP_POWER: 0, AP_TACTIC: 0, AP_DEFENSE: 0, AP_ATTACK: 0, AP_WARD: 0 };
            inventory.FocusXP[request.Polarity] += xp;
            addMiscItems(inventory, request.Shards);
            await inventory.save();
            break;
        }
    }
};

enum FocusOperation {
    UnlockWay = "2",
    UnlockUpgrade = "3",
    LevelUpUpgrade = "4",
    ActivateWay = "5",
    ConvertShard = "9"
}

// For UnlockWay & ActivateWay
interface IWayRequest {
    FocusType: string;
}

interface IUnlockUpgradeRequest {
    FocusTypes: string[];
}

interface ILevelUpUpgradeRequest {
    FocusInfos: {
        ItemType: string;
        FocusXpCost: number;
        IsUniversal: boolean;
        Level: number;
        IsActiveAbility: boolean;
    }[];
}

interface IConvertShardRequest {
    Shards: IMiscItem[];
    Polarity: TFocusPolarity;
}

// Works for ways & upgrades
const focusTypeToPolarity = (type: string): TFocusPolarity => {
    return ("AP_" + type.substr(1).split("/")[3].toUpperCase()) as TFocusPolarity;
};

const shardValues = {
    "/Lotus/Types/Gameplay/Eidolon/Resources/SentientShards/SentientShardCommonItem": 2_500,
    "/Lotus/Types/Gameplay/Eidolon/Resources/SentientShards/SentientShardSynthesizedItem": 5_000,
    "/Lotus/Types/Gameplay/Eidolon/Resources/SentientShards/SentientShardBrilliantItem": 25_000,
    "/Lotus/Types/Gameplay/Eidolon/Resources/SentientShards/SentientShardBrilliantTierTwoItem": 40_000
};
