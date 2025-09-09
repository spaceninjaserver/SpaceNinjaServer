import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory, addMiscItems, addEquipment, occupySlot } from "../../services/inventoryService.ts";
import type { IMiscItem, TFocusPolarity, TEquipmentKey } from "../../types/inventoryTypes/inventoryTypes.ts";
import { InventorySlot } from "../../types/inventoryTypes/inventoryTypes.ts";
import { logger } from "../../utils/logger.ts";
import { ExportFocusUpgrades } from "warframe-public-export-plus";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";

export const focusController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    switch (req.query.op) {
        default:
            logger.error("Unhandled focus op type: " + String(req.query.op));
            logger.debug(String(req.body));
            res.end();
            break;
        case FocusOperation.InstallLens: {
            const request = JSON.parse(String(req.body)) as ILensInstallRequest;
            const inventory = await getInventory(accountId);
            const item = inventory[request.Category].id(request.WeaponId);
            if (item) {
                item.FocusLens = request.LensType;
                addMiscItems(inventory, [
                    {
                        ItemType: request.LensType,
                        ItemCount: -1
                    } satisfies IMiscItem
                ]);
            }
            await inventory.save();
            res.json({
                weaponId: request.WeaponId,
                lensType: request.LensType
            });
            break;
        }
        case FocusOperation.UnlockWay: {
            const focusType = (JSON.parse(String(req.body)) as IWayRequest).FocusType;
            const focusPolarity = focusTypeToPolarity(focusType);
            const inventory = await getInventory(accountId, "FocusAbility FocusUpgrades FocusXP");
            const cost = inventory.FocusAbility ? 50_000 : 0;
            inventory.FocusAbility ??= focusType;
            inventory.FocusUpgrades.push({ ItemType: focusType });
            if (cost) {
                inventory.FocusXP![focusPolarity]! -= cost;
            }
            await inventory.save();
            res.json({
                FocusUpgrade: { ItemType: focusType },
                FocusPointCosts: { [focusPolarity]: cost }
            });
            break;
        }
        case FocusOperation.ActivateWay: {
            const focusType = (JSON.parse(String(req.body)) as IWayRequest).FocusType;

            await Inventory.updateOne(
                {
                    accountOwnerId: accountId
                },
                {
                    FocusAbility: focusType
                }
            );

            res.json({
                FocusUpgrade: { ItemType: focusType }
            });
            break;
        }
        case FocusOperation.UnlockUpgrade: {
            const request = JSON.parse(String(req.body)) as IUnlockUpgradeRequest;
            const focusPolarity = focusTypeToPolarity(request.FocusTypes[0]);
            const inventory = await getInventory(accountId);
            let cost = 0;
            for (const focusType of request.FocusTypes) {
                cost += ExportFocusUpgrades[focusType].baseFocusPointCost;
                inventory.FocusUpgrades.push({ ItemType: focusType, Level: 0 });
            }
            inventory.FocusXP![focusPolarity]! -= cost;
            await inventory.save();
            res.json({
                FocusTypes: request.FocusTypes,
                FocusPointCosts: { [focusPolarity]: cost }
            });
            break;
        }
        case FocusOperation.LevelUpUpgrade: {
            const request = JSON.parse(String(req.body)) as ILevelUpUpgradeRequest;
            const focusPolarity = focusTypeToPolarity(request.FocusInfos[0].ItemType);
            const inventory = await getInventory(accountId);
            let cost = 0;
            for (const focusUpgrade of request.FocusInfos) {
                cost += focusUpgrade.FocusXpCost;
                const focusUpgradeDb = inventory.FocusUpgrades.find(entry => entry.ItemType == focusUpgrade.ItemType)!;
                focusUpgradeDb.Level = focusUpgrade.Level;
            }
            inventory.FocusXP![focusPolarity]! -= cost;
            await inventory.save();
            res.json({
                FocusInfos: request.FocusInfos,
                FocusPointCosts: { [focusPolarity]: cost }
            });
            break;
        }
        case FocusOperation.SentTrainingAmplifier: {
            const request = JSON.parse(String(req.body)) as ISentTrainingAmplifierRequest;
            const inventory = await getInventory(accountId);
            const inventoryChanges = addEquipment(inventory, "OperatorAmps", request.StartingWeaponType, {
                ModularParts: [
                    "/Lotus/Weapons/Sentients/OperatorAmplifiers/SentTrainingAmplifier/SentAmpTrainingGrip",
                    "/Lotus/Weapons/Sentients/OperatorAmplifiers/SentTrainingAmplifier/SentAmpTrainingChassis",
                    "/Lotus/Weapons/Sentients/OperatorAmplifiers/SentTrainingAmplifier/SentAmpTrainingBarrel"
                ]
            });
            occupySlot(inventory, InventorySlot.AMPS, false);
            await inventory.save();
            res.json(inventoryChanges.OperatorAmps![0]);
            break;
        }
        case FocusOperation.UnbindUpgrade: {
            const request = JSON.parse(String(req.body)) as IUnbindUpgradeRequest;
            const focusPolarity = focusTypeToPolarity(request.FocusTypes[0]);
            const inventory = await getInventory(accountId);
            inventory.FocusXP![focusPolarity]! -= 750_000 * request.FocusTypes.length;
            addMiscItems(inventory, [
                {
                    ItemType: "/Lotus/Types/Gameplay/Eidolon/Resources/SentientShards/SentientShardBrilliantItem",
                    ItemCount: request.FocusTypes.length * -1
                }
            ]);
            request.FocusTypes.forEach(type => {
                const focusUpgradeDb = inventory.FocusUpgrades.find(entry => entry.ItemType == type)!;
                focusUpgradeDb.IsUniversal = true;
            });
            await inventory.save();
            res.json({
                FocusTypes: request.FocusTypes,
                FocusPointCosts: {
                    [focusPolarity]: 750_000 * request.FocusTypes.length
                },
                MiscItemCosts: [
                    {
                        ItemType: "/Lotus/Types/Gameplay/Eidolon/Resources/SentientShards/SentientShardBrilliantItem",
                        ItemCount: request.FocusTypes.length
                    }
                ]
            });
            break;
        }
        case FocusOperation.ConvertShard: {
            const request = JSON.parse(String(req.body)) as IConvertShardRequest;
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
            const polarity = request.Polarity;
            inventory.FocusXP ??= {};
            inventory.FocusXP[polarity] ??= 0;
            inventory.FocusXP[polarity] += xp;
            addMiscItems(inventory, request.Shards);
            await inventory.save();
            break;
        }
    }
};

enum FocusOperation {
    InstallLens = "1",
    UnlockWay = "2",
    UnlockUpgrade = "3",
    LevelUpUpgrade = "4",
    ActivateWay = "5",
    SentTrainingAmplifier = "7",
    UnbindUpgrade = "8",
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

interface IUnbindUpgradeRequest {
    ShardTypes: string[];
    FocusTypes: string[];
}

interface IConvertShardRequest {
    Shards: IMiscItem[];
    Polarity: TFocusPolarity;
}

interface ISentTrainingAmplifierRequest {
    StartingWeaponType: string;
}

interface ILensInstallRequest {
    LensType: string;
    Category: TEquipmentKey;
    WeaponId: string;
}

// Works for ways & upgrades
const focusTypeToPolarity = (type: string): TFocusPolarity => {
    return ("AP_" + type.substring(1).split("/")[3].toUpperCase()) as TFocusPolarity;
};

const shardValues = {
    "/Lotus/Types/Gameplay/Eidolon/Resources/SentientShards/SentientShardCommonItem": 2_500,
    "/Lotus/Types/Gameplay/Eidolon/Resources/SentientShards/SentientShardSynthesizedItem": 5_000,
    "/Lotus/Types/Gameplay/Eidolon/Resources/SentientShards/SentientShardBrilliantItem": 25_000,
    "/Lotus/Types/Gameplay/Eidolon/Resources/SentientShards/SentientShardBrilliantTierTwoItem": 40_000
};
