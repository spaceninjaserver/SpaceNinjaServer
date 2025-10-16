import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";
import { getInventory, addMiscItems, addEquipment, occupySlot } from "../../services/inventoryService.ts";
import type { IMiscItem, TFocusPolarity, TEquipmentKey } from "../../types/inventoryTypes/inventoryTypes.ts";
import { InventorySlot } from "../../types/inventoryTypes/inventoryTypes.ts";
import { logger } from "../../utils/logger.ts";
import { ExportFocusUpgrades } from "warframe-public-export-plus";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";

export const focusController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);

    let op = req.query.op as string;
    const focus2 = account.BuildLabel && version_compare(account.BuildLabel, "2022.04.29.12.53") < 0;
    if (focus2) {
        // Focus 2.0
        switch (req.query.op) {
            case Focus2Operation.InstallLens:
                op = "InstallLens";
                break;
            case Focus2Operation.UnlockWay:
                op = "UnlockWay";
                break;
            case Focus2Operation.UnlockUpgrade:
                op = "UnlockUpgrade";
                break;
            case Focus2Operation.IncreasePool:
                op = "IncreasePool";
                break;
            case Focus2Operation.LevelUpUpgrade:
                op = "LevelUpUpgrade";
                break;
            case Focus2Operation.ActivateWay:
                op = "ActivateWay";
                break;
            case Focus2Operation.UpdateUpgrade:
                op = "UpdateUpgrade";
                break;
            case Focus2Operation.SentTrainingAmplifier:
                op = "SentTrainingAmplifier";
                break;
            case Focus2Operation.UnbindUpgrade:
                op = "UnbindUpgrade";
                break;
            case Focus2Operation.ConvertShard:
                op = "ConvertShard";
                break;
        }
    } else {
        // Focus 3.0
        switch (req.query.op) {
            case Focus3Operation.InstallLens:
                op = "InstallLens";
                break;
            case Focus3Operation.UnlockWay:
                op = "UnlockWay";
                break;
            case Focus3Operation.UnlockUpgrade:
                op = "UnlockUpgrade";
                break;
            case Focus3Operation.LevelUpUpgrade:
                op = "LevelUpUpgrade";
                break;
            case Focus3Operation.ActivateWay:
                op = "ActivateWay";
                break;
            case Focus3Operation.SentTrainingAmplifier:
                op = "SentTrainingAmplifier";
                break;
            case Focus3Operation.UnbindUpgrade:
                op = "UnbindUpgrade";
                break;
            case Focus3Operation.ConvertShard:
                op = "ConvertShard";
                break;
        }
    }

    switch (op) {
        default:
            logger.error("Unhandled focus op type: " + String(req.query.op));
            logger.debug(String(req.body));
            res.end();
            break;
        case "InstallLens": {
            const request = JSON.parse(String(req.body)) as ILensInstallRequest;
            const inventory = await getInventory(account._id.toString());
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
        case "UnlockWay": {
            const focusType = (JSON.parse(String(req.body)) as IWayRequest).FocusType;
            const focusPolarity = focusTypeToPolarity(focusType);
            const inventory = await getInventory(account._id.toString(), "FocusAbility FocusUpgrades FocusXP");
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
        case "IncreasePool": {
            const request = JSON.parse(String(req.body)) as IIncreasePoolRequest;
            const focusPolarity = focusTypeToPolarity(request.FocusType);
            const inventory = await getInventory(account._id.toString(), "FocusXP FocusCapacity");
            let cost = 0;
            for (let capacity = request.CurrentTotalCapacity; capacity != request.NewTotalCapacity; ++capacity) {
                cost += increasePoolCost[capacity - 5];
            }
            inventory.FocusXP![focusPolarity]! -= cost;
            inventory.FocusCapacity = request.NewTotalCapacity;
            await inventory.save();
            res.json({
                TotalCapacity: request.NewTotalCapacity,
                FocusPointCosts: { [focusPolarity]: cost }
            });
            break;
        }
        case "ActivateWay": {
            const focusType = (JSON.parse(String(req.body)) as IWayRequest).FocusType;

            await Inventory.updateOne(
                {
                    accountOwnerId: account._id.toString()
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
        case "UnlockUpgrade": {
            const request = JSON.parse(String(req.body)) as IUnlockUpgradeRequest;
            const focusPolarity = focusTypeToPolarity(request.FocusTypes[0]);
            const inventory = await getInventory(account._id.toString());
            let cost = 0;
            for (const focusType of request.FocusTypes) {
                if (focusType in ExportFocusUpgrades) {
                    cost += ExportFocusUpgrades[focusType].baseFocusPointCost;
                } else if (focusType == "/Lotus/Upgrades/Focus/Power/Residual/ChannelEfficiencyFocusUpgrade") {
                    // Zenurik's Inner Might (Focus 2.0)
                    cost += 50_000;
                } else {
                    logger.warn(`unknown focus upgrade ${focusType}, will unlock it for free`);
                }
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
        case "LevelUpUpgrade":
        case "UpdateUpgrade": {
            const request = JSON.parse(String(req.body)) as ILevelUpUpgradeRequest;
            const focusPolarity = focusTypeToPolarity(request.FocusInfos[0].ItemType);
            const inventory = await getInventory(account._id.toString());
            let cost = 0;
            for (const focusUpgrade of request.FocusInfos) {
                cost += focusUpgrade.FocusXpCost;
                const focusUpgradeDb = inventory.FocusUpgrades.find(entry => entry.ItemType == focusUpgrade.ItemType)!;
                if (op == "UpdateUpgrade") {
                    focusUpgradeDb.IsActive = focusUpgrade.IsActive;
                } else {
                    focusUpgradeDb.Level = focusUpgrade.Level;
                }
            }
            inventory.FocusXP![focusPolarity]! -= cost;
            await inventory.save();
            res.json({
                FocusInfos: request.FocusInfos,
                FocusPointCosts: { [focusPolarity]: cost }
            });
            break;
        }
        case "SentTrainingAmplifier": {
            const request = JSON.parse(String(req.body)) as ISentTrainingAmplifierRequest;
            const inventory = await getInventory(account._id.toString());
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
        case "UnbindUpgrade": {
            const request = JSON.parse(String(req.body)) as IUnbindUpgradeRequest;
            const focusPolarity = focusTypeToPolarity(request.FocusTypes[0]);
            const inventory = await getInventory(account._id.toString());
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
        case "ConvertShard": {
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
            const inventory = await getInventory(account._id.toString());
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

// Focus 3.0
enum Focus3Operation {
    InstallLens = "1",
    UnlockWay = "2",
    UnlockUpgrade = "3",
    LevelUpUpgrade = "4",
    ActivateWay = "5",
    SentTrainingAmplifier = "7",
    UnbindUpgrade = "8",
    ConvertShard = "9"
}

// Focus 2.0
enum Focus2Operation {
    InstallLens = "1",
    UnlockWay = "2",
    UnlockUpgrade = "3",
    IncreasePool = "4",
    LevelUpUpgrade = "5",
    ActivateWay = "6",
    UpdateUpgrade = "7", // used to change the IsActive state, same format as ILevelUpUpgradeRequest
    SentTrainingAmplifier = "9",
    UnbindUpgrade = "10",
    ConvertShard = "11"
}

// For UnlockWay & ActivateWay
interface IWayRequest {
    FocusType: string;
}

interface IUnlockUpgradeRequest {
    FocusTypes: string[];
}

// Focus 2.0
interface IIncreasePoolRequest {
    FocusType: string;
    CurrentTotalCapacity: number;
    NewTotalCapacity: number;
}

interface ILevelUpUpgradeRequest {
    FocusInfos: {
        ItemType: string;
        FocusXpCost: number;
        IsUniversal: boolean;
        Level: number;
        IsActiveAbility: boolean;
        IsActive?: number; // Focus 2.0
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

// Starting at a capacity of 5 (Source: https://wiki.warframe.com/w/Focus_2.0)
const increasePoolCost = [
    2576, 3099, 3638, 4190, 4755, 5331, 5918, 6514, 7120, 7734, 8357, 8988, 9626, 10271, 10923, 11582, 12247, 12918,
    13595, 14277, 14965, 15659, 16357, 17061, 17769, 18482, 19200, 19922, 20649, 21380, 22115, 22854, 23597, 24344,
    25095, 25850, 26609, 27371, 28136, 28905, 29678, 30454, 31233, 32015, 32801, 33590, 34382, 35176, 35974, 36775,
    37579, 38386, 39195, 40008, 40823, 41641, 42461, 43284, 44110, 44938, 45769, 46603, 47439, 48277, 49118, 49961,
    50807, 51655, 52505, 53357, 54212, 55069, 55929, 56790, 57654, 58520, 59388, 60258, 61130, 62005, 62881, 63759,
    64640, 65522, 66407, 67293, 68182, 69072, 69964, 70858, 71754, 72652, 73552, 74453, 75357, 76262, 77169, 78078,
    78988, 79900, 80814, 81730, 82648, 83567, 84488, 85410, 86334, 87260, 88188, 89117, 90047, 90980, 91914, 92849,
    93786, 94725, 95665, 96607, 97550, 98495, 99441, 100389, 101338, 102289, 103241, 104195, 105150, 106107, 107065,
    108024, 108985, 109948, 110911, 111877, 112843, 113811, 114780, 115751, 116723, 117696, 118671, 119647, 120624,
    121603, 122583, 123564, 124547, 125531, 126516, 127503, 128490, 129479, 130470, 131461, 132454, 133448, 134443,
    135440, 136438, 137437, 138437, 139438, 140441, 141444, 142449, 143455, 144463, 145471, 146481, 147492, 148503,
    149517
];
