import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import type { TDescentCategory } from "../../types/inventoryTypes/inventoryTypes.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { ICountedStoreItem } from "warframe-public-export-plus";
import { getRandomElement, getRandomInt } from "../../services/rngService.ts";
import { logger } from "../../utils/logger.ts";

export const descentRewardsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString<IDescentRewardsRequest>(String(req.body));
    if (payload.Mode == "r") {
        const inventory = await getInventory(accountId, "DescentRewards");
        inventory.DescentRewards ??= [];
        let entry = inventory.DescentRewards.find(x => x.Category == payload.Category);
        if (!entry) {
            entry = {
                Category: payload.Category,
                Expiry: new Date(0),
                FloorClaimed: 0,
                PendingRewards: [],
                Seed: 0,
                SelectedUpgrades: []
            };
            inventory.DescentRewards.push(entry);
        }

        const weekStart = 1734307200_000 + Math.trunc((Date.now() - 1734307200_000) / 604800000) * 604800000;
        const weekEnd = weekStart + 604800000;

        if (entry.Expiry.getTime() != weekEnd) {
            entry.Expiry = new Date(weekEnd);
            entry.FloorClaimed = 0;
            entry.PendingRewards = [
                {
                    FloorCheckpoint: 2,
                    Rewards: [getRandomElement(bronzeRewards[payload.Category])!]
                },
                {
                    FloorCheckpoint: 4,
                    Rewards: [
                        getRandomElement(
                            payload.Category == "DM_COH_NORMAL" ? bronzeRewards.DM_COH_NORMAL : spSilverRewards
                        )!
                    ]
                },
                {
                    FloorCheckpoint: 6,
                    Rewards: [{ StoreItem: getRandomElement(arcaneRewards[payload.Category])!, ItemCount: 1 }]
                },
                {
                    FloorCheckpoint: 9,
                    Rewards: [getRandomElement(bronzeRewards[payload.Category])!]
                },
                {
                    FloorCheckpoint: 11,
                    Rewards: [
                        getRandomElement(
                            payload.Category == "DM_COH_NORMAL" ? bronzeRewards.DM_COH_NORMAL : spSilverRewards
                        )!
                    ]
                },
                {
                    FloorCheckpoint: 13,
                    Rewards: [{ StoreItem: getRandomElement(arcaneRewards[payload.Category])!, ItemCount: 1 }]
                },
                {
                    FloorCheckpoint: 16,
                    Rewards: [getRandomElement(bronzeRewards[payload.Category])!]
                },
                {
                    FloorCheckpoint: 18,
                    Rewards: [
                        payload.Category == "DM_COH_NORMAL"
                            ? getRandomElement(bronzeRewards.DM_COH_NORMAL)!
                            : {
                                  StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/SteelEssence",
                                  ItemCount: 25
                              }
                    ]
                },
                {
                    FloorCheckpoint: 20,
                    Rewards: [{ StoreItem: getRandomElement(arcaneRewards[payload.Category])!, ItemCount: 3 }]
                },
                {
                    FloorCheckpoint: 21,
                    Rewards: [getRandomElement(finalRewards[payload.Category])!]
                }
            ];
            entry.Seed = getRandomInt(-1_000_000_000, 1_000_000_000);
            entry.SelectedUpgrades = [];
        }

        await inventory.save();
        res.json({
            Expiry: { $date: { $numberLong: weekEnd.toString() } },
            FloorClaimed: entry.FloorClaimed,
            PendingRewards: entry.PendingRewards,
            Seed: entry.Seed,
            SelectedUpgrades: entry.SelectedUpgrades
        });
    } else if (payload.Mode == "s") {
        const inventory = await getInventory(accountId, "DescentRewards");
        inventory.DescentRewards ??= [];
        const entry = inventory.DescentRewards.find(x => x.Category == payload.Category);
        if (!entry) {
            logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
            throw new Error(`missing DescentRewards entry`);
        }

        entry.SelectedUpgrades = payload.SelectedUpgrades;

        await inventory.save();
        res.json({
            Expiry: entry.Expiry,
            FloorClaimed: entry.FloorClaimed,
            PendingRewards: entry.PendingRewards,
            Seed: entry.Seed,
            SelectedUpgrades: entry.SelectedUpgrades
        });
    } else {
        logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
        throw new Error(`unexpected descentRewards mode: ${payload.Mode}`);
    }
};

type IDescentRewardsRequest =
    | {
          Mode: "r";
          Category: TDescentCategory;
      }
    | {
          Mode: "s";
          Category: TDescentCategory;
          SelectedUpgrades: string[];
      }
    | {
          Mode: "something else";
      };

// https://wiki.warframe.com/w/The_Descendia#Rewards

const bronzeRewards: Record<TDescentCategory, ICountedStoreItem[]> = {
    DM_COH_NORMAL: [
        {
            StoreItem: "/Lotus/StoreItems/Types/PickUps/Credits/10000Credits",
            ItemCount: 3
        },
        {
            StoreItem: "/Lotus/StoreItems/Upgrades/Mods/FusionBundles/JunctionRewardNPFusionBundleA",
            ItemCount: 1
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/DistillPoints",
            ItemCount: 50
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Gameplay/Tau/Resources/CoHResourceCommonItem",
            ItemCount: 25
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Gameplay/Tau/Resources/CoHResourceRareItem",
            ItemCount: 5
        }
    ],
    DM_COH_HARD: [
        {
            StoreItem: "/Lotus/StoreItems/Types/Gameplay/Tau/Resources/CoHResourceCommonItem",
            ItemCount: 75
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Gameplay/Tau/Resources/CoHResourceRareItem",
            ItemCount: 15
        }
    ]
};

const arcaneRewards: Record<TDescentCategory, string[]> = {
    DM_COH_NORMAL: [
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Utility/GolemArcaneAimGlideOnHeadshot",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/FireProcResist",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/GolemArcaneSniperSpeedOnCrit",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/MagneticProcResist",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/GolemArcaneShotgunSpeedOnCrit",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/FreezeProcResist",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/SlashProcResist",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/RadiationProcResist",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/ElectricityProcResist",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/HealthRegenOnHeadshot",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/LongGunSpeedOnCrit",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/SpeedOnDamage",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Utility/PistolDamageOnReload",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Utility/RadialKnockdownOnEnergyPickup",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/SpeedOnParry",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/MeleeSpeedOnHit",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/GolemArcanePistolDamageOnHeadshot",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Utility/RadialHealOnHealthPickup",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/GolemArcaneArmorOnFinisher",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/InvisibilityOnFinisher",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/GolemArcanePistolSpeedOnCrit",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Utility/GolemArcaneBonusDamageOnWallLatch",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/CritChanceOnDamage",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/GolemArcaneMeleeDamageOnCrit",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/LongGunDamageOnHeadshot"
    ],
    DM_COH_HARD: [
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/DamageForBonusArmour",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/SplitStatusProcsOnStackedStatusHit",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/MultishotForMaxEnergy",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Utility/AbilityDurationOnCast",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/ShieldMaxForAbilityStrength",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/MaxDPSTakenForArmour",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/StealDefensiveStatsOnRoll",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/RadialDamageOnMaxRadiationStackHit",
        "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Utility/FreezeEnemiesOnRoll"
    ]
};

const spSilverRewards: ICountedStoreItem[] = [
    {
        StoreItem: "/Lotus/StoreItems/Types/Recipes/Components/FormaBlueprint",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/Mods/Randomized/RawMeleeRandomMod",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/Mods/Randomized/RawPistolRandomMod",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/Mods/Randomized/RawRifleRandomMod",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/Mods/Randomized/RawShotgunRandomMod",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/Mods/Randomized/RawModularMeleeRandomMod",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/Mods/Randomized/RawModularPistolRandomMod",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/WeaponPrimaryArcaneUnlocker",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/WeaponSecondaryArcaneUnlocker",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/WeaponMeleeArcaneUnlocker",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/WeaponAmpArcaneUnlocker",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/Types/StoreItems/Boosters/AffinityBooster3DayStoreItem",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/Types/StoreItems/Boosters/ResourceAmount3DayStoreItem",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/Types/StoreItems/Boosters/ModDropChanceBooster3DayStoreItem",
        ItemCount: 1
    }
];

const finalRewards: Record<TDescentCategory, ICountedStoreItem[]> = {
    DM_COH_NORMAL: [
        {
            StoreItem: "/Lotus/StoreItems/Types/Recipes/Components/FormaBlueprint",
            ItemCount: 1
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/WeaponPrimaryArcaneUnlocker",
            ItemCount: 1
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/WeaponSecondaryArcaneUnlocker",
            ItemCount: 1
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/WeaponMeleeArcaneUnlocker",
            ItemCount: 1
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/WeaponAmpArcaneUnlocker",
            ItemCount: 1
        }
    ],
    DM_COH_HARD: [
        {
            StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/OrokinCatalyst",
            ItemCount: 1
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/OrokinReactor",
            ItemCount: 1
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Recipes/Components/FormaAuraBlueprint",
            ItemCount: 1
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Recipes/Lens/AttackLensOstronBlueprint",
            ItemCount: 1
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Recipes/Lens/DefenseLensOstronBlueprint",
            ItemCount: 1
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Recipes/Lens/PowerLensOstronBlueprint",
            ItemCount: 1
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Recipes/Lens/TacticLensOstronBlueprint",
            ItemCount: 1
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Recipes/Lens/WardLensOstronBlueprint",
            ItemCount: 1
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Gameplay/NarmerSorties/ArchonCrystalAmar",
            ItemCount: 1
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Gameplay/NarmerSorties/ArchonCrystalNira",
            ItemCount: 1
        },
        {
            StoreItem: "/Lotus/StoreItems/Types/Gameplay/NarmerSorties/ArchonCrystalBoreal",
            ItemCount: 1
        }
    ]
};
