import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import type { TDescentCategory } from "../../types/inventoryTypes/inventoryTypes.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { ICountedStoreItem } from "warframe-public-export-plus";
import { getRandomElement, getRandomInt } from "../../services/rngService.ts";
import { logger } from "../../utils/logger.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";

export const descentRewardsController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (account.BuildLabel && version_compare(account.BuildLabel, gameToBuildVersion["41.0.0"]) < 0) {
        throw new Error(
            `account logged into ${account.BuildLabel} (< 41.0.0) but is now attempting to call a >= 41.0.0 endpoint ?!`
        );
    }
    const payload = getJSONfromString<IDescentRewardsRequest>(String(req.body));
    if (payload.Mode == "r") {
        const inventory = await getInventory(account._id.toString(), "DescentRewards");
        inventory.DescentRewards ??= [];
        let entry = inventory.DescentRewards.find(x => x.Category == payload.Category);
        if (!entry) {
            entry = {
                Category: payload.Category,
                Expiry: new Date(0),
                FloorsClaimed: 0,
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
            entry.FloorsClaimed = 0;
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
                    Rewards: [getRandomElement(arcaneRewards)!]
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
                    Rewards: [getRandomElement(arcaneRewards)!]
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
                    Rewards: [getRandomElement(tripleArcaneRewards)!]
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
            FloorClaimed: entry.FloorsClaimed,
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

const arcaneRewards: ICountedStoreItem[] = [
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/DamageForBonusArmour",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/SplitStatusProcsOnStackedStatusHit",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/MultishotForMaxEnergy",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Utility/AbilityDurationOnCast",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/ShieldMaxForAbilityStrength",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/MaxDPSTakenForArmour",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/StealDefensiveStatsOnRoll",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/RadialDamageOnMaxRadiationStackHit",
        ItemCount: 1
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Utility/FreezeEnemiesOnRoll",
        ItemCount: 1
    }
];

const tripleArcaneRewards: ICountedStoreItem[] = [
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/DamageForBonusArmour",
        ItemCount: 3
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/SplitStatusProcsOnStackedStatusHit",
        ItemCount: 3
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/MultishotForMaxEnergy",
        ItemCount: 3
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Utility/AbilityDurationOnCast",
        ItemCount: 3
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/ShieldMaxForAbilityStrength",
        ItemCount: 3
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/MaxDPSTakenForArmour",
        ItemCount: 3
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Defensive/StealDefensiveStatsOnRoll",
        ItemCount: 3
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Offensive/RadialDamageOnMaxRadiationStackHit",
        ItemCount: 3
    },
    {
        StoreItem: "/Lotus/StoreItems/Upgrades/CosmeticEnhancers/Utility/FreezeEnemiesOnRoll",
        ItemCount: 3
    }
];

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
