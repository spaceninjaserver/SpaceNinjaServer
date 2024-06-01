import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory, addMiscItems } from "@/src/services/inventoryService";
import { IMiscItem, TFocusPolarity } from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";

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

const shardValues = {
    "/Lotus/Types/Gameplay/Eidolon/Resources/SentientShards/SentientShardCommonItem": 2_500,
    "/Lotus/Types/Gameplay/Eidolon/Resources/SentientShards/SentientShardSynthesizedItem": 5_000,
    "/Lotus/Types/Gameplay/Eidolon/Resources/SentientShards/SentientShardBrilliantItem": 25_000,
    "/Lotus/Types/Gameplay/Eidolon/Resources/SentientShards/SentientShardBrilliantTierTwoItem": 40_000
};

const baseFocusPointCosts = {
    "/Lotus/Upgrades/Focus/Attack/Active/AttackEfficiencyFocusUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Attack/Active/BlastChargeFocusUpgrade": 80000,
    "/Lotus/Upgrades/Focus/Attack/Active/BlastFireballFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Attack/Active/CloakAttackChargeFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Attack/Active/CloakBlindFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Attack/Active/ConsecutiveEfficienyUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Attack/Active/ConsecutivePowerUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Attack/Active/DashDamageFocusUpgrade": 80000,
    "/Lotus/Upgrades/Focus/Attack/Active/DashFireFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Attack/Active/GhostWaveUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Attack/Active/GhostlyTouchUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Attack/Residual/ElementalDamageFocusUpgrade": 25000,
    "/Lotus/Upgrades/Focus/Attack/Residual/PhysicalDamageFocusUpgrade": 25000,
    "/Lotus/Upgrades/Focus/Attack/Residual/PowerSnapFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Attack/Stats/MoreAmmoFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Attack/Stats/RegenAmmoFocusUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Defense/Active/BlastAllyShieldFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Defense/Active/BlastSelfShieldFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Defense/Active/CloakHealFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Defense/Active/CloakHealOthersFocusUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Defense/Active/CloakShieldFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Defense/Active/DashImmunityFocusUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Defense/Active/DashShockwaveFocusUpgrade": 80000,
    "/Lotus/Upgrades/Focus/Defense/Active/DefenseShieldBreakFocusUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Defense/Active/DefenseShieldFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Defense/Active/SonicDissipationUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Defense/Residual/InstantReviveFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Defense/Residual/RadialXpFocusUpgrade": 25000,
    "/Lotus/Upgrades/Focus/Defense/Stats/HealthMaxFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Defense/Stats/HealthRegenFocusUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Power/Active/BlastBurstFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Power/Active/BlastSlowFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Power/Active/CloakPullFocusUpgrade": 80000,
    "/Lotus/Upgrades/Focus/Power/Active/CloakStaticFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Power/Active/DashBubbleFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Power/Active/DashElectricityFocusUpgrade": 80000,
    "/Lotus/Upgrades/Focus/Power/Active/DisarmedEnergyUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Power/Active/DisarmingProjectionUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Power/Active/PowerFieldFocusUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Power/Residual/EnergyOverTimeFocusUpgrade": 25000,
    "/Lotus/Upgrades/Focus/Power/Residual/FreeAbilityCastsFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Power/Residual/SlowHeadshotDamageFocusUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Power/Stats/EnergyPoolFocusUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Power/Stats/EnergyRestoreFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Tactic/Active/BlastConfuseFocusUpgrade": 25000,
    "/Lotus/Upgrades/Focus/Tactic/Active/BlastDisarmFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Tactic/Active/CloakMeleeCritFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Tactic/Active/CloakRevealFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Tactic/Active/ComboAmpDamageFocusUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Tactic/Active/DashFinisherFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Tactic/Active/DashWaveFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Tactic/Active/FinisherTransferenceUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Tactic/Active/LiftHitDamageUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Tactic/Active/LiftHitWaveUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Tactic/Active/ProjectionExecutionUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Tactic/Active/ProjectionStretchUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Tactic/Active/SlamComboFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Tactic/Residual/MeleeComboFocusUpgrade": 25000,
    "/Lotus/Upgrades/Focus/Tactic/Residual/MeleeXpFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Tactic/Stats/DashSpeedFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Tactic/Stats/MoveSpeedFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Ward/Active/BlastBulletAttractorFocusUpgrade": 80000,
    "/Lotus/Upgrades/Focus/Ward/Active/BlastDamagePickupFocusUpgrade": 80000,
    "/Lotus/Upgrades/Focus/Ward/Active/ClearStaticOnKillFocusUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Ward/Active/CloakAllyCloakFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Ward/Active/CloakReduceDamageFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Ward/Active/DashReduceArmourFocusUpgrade": 80000,
    "/Lotus/Upgrades/Focus/Ward/Active/DashReduceDamageFocusUpgrade": 80000,
    "/Lotus/Upgrades/Focus/Ward/Active/InvulnerableReturnFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Ward/Active/KnockdownImmunityFocusUpgrade": 25000,
    "/Lotus/Upgrades/Focus/Ward/Active/MagneticExtensionUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Ward/Active/MagneticFieldFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Ward/Active/SunderingDissipationUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Ward/Active/UnairuWispFocusUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Ward/Residual/ArmourBuffFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Ward/Residual/ReflectDamageFocusUpgrade": 25000,
    "/Lotus/Upgrades/Focus/Ward/Residual/SecondChanceDamageBuffFocusUpgrade": 95000,
    "/Lotus/Upgrades/Focus/Ward/Residual/SecondChanceFocusUpgrade": 60000,
    "/Lotus/Upgrades/Focus/Ward/Stats/ArmourIncreaseFocusUpgrade": 50000,
    "/Lotus/Upgrades/Focus/Ward/Stats/BlastRadiusFocusUpgrade": 50000
};
