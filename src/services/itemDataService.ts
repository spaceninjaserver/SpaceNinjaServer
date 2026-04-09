import type { IKeyChainRequest } from "../types/requestTypes.ts";
import type {
    IBoosterPack,
    IBundle,
    IDefaultUpgrade,
    IInboxMessage,
    IKey,
    IMissionReward,
    IRecipe,
    IRegion,
    ISyndicate,
    TMissionDeck,
    TRarity,
    TReward
} from "warframe-public-export-plus";
import {
    dict_de,
    dict_en,
    dict_es,
    dict_fr,
    dict_it,
    dict_ja,
    dict_ko,
    dict_pl,
    dict_pt,
    dict_ru,
    dict_tc,
    dict_th,
    dict_tr,
    dict_uk,
    dict_zh,
    ExportArcanes,
    ExportBoosterPacks,
    ExportBoosters,
    ExportBundles,
    ExportCreditBundles,
    ExportCustoms,
    ExportDojoRecipes,
    ExportDrones,
    ExportFlavour,
    ExportGear,
    ExportKeys,
    ExportRailjackWeapons,
    ExportRecipes,
    ExportResources,
    ExportRewards,
    ExportSentinels,
    ExportSyndicates,
    ExportWarframes,
    ExportWeapons
} from "warframe-public-export-plus";
import type { IMessage } from "../models/inboxModel.ts";
import { logger } from "../utils/logger.ts";
import { version_compare } from "../helpers/inventoryHelpers.ts";
import vorsPrizePreU40Rewards from "../../static/fixed_responses/vorsPrizePreU40Rewards.json" with { type: "json" };
import gameToBuildVersion from "../constants/gameToBuildVersion.ts";
import EntratiSyndicate_pre_U41 from "../../static/fixed_responses/data/EntratiSyndicate_pre_U41.json" with { type: "json" };
import { getWorldState } from "./worldStateService.ts";

export type WeaponTypeInternal =
    | "LongGuns"
    | "Pistols"
    | "Melee"
    | "SpaceMelee"
    | "SpaceGuns"
    | "SentinelWeapons"
    | "OperatorAmps"
    | "SpecialItems";

export const supplementalRecipes: Record<string, IRecipe> = {
    // Removed in 39.0.0
    "/Lotus/Types/Recipes/EidolonRecipes/OpenArchwingSummonBlueprint": {
        resultType: "/Lotus/Types/Restoratives/OpenArchwingSummon",
        buildPrice: 7500,
        buildTime: 1800,
        skipBuildTimePrice: 10,
        consumeOnUse: false,
        num: 1,
        codexSecret: false,
        alwaysAvailable: true,
        ingredients: [
            {
                ItemType: "/Lotus/Types/Gameplay/Eidolon/Resources/IraditeItem",
                ItemCount: 50
            },
            {
                ItemType: "/Lotus/Types/Gameplay/Eidolon/Resources/GrokdrulItem",
                ItemCount: 50
            },
            {
                ItemType: "/Lotus/Types/Items/Fish/Eidolon/FishParts/EidolonFishOilItem",
                ItemCount: 30
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Circuits",
                ItemCount: 600
            }
        ],
        excludeFromMarket: true,
        tradable: false
    },
    // The Law of Retribution raid bp. Removed in 22.14.0
    "/Lotus/Types/Keys/GrineerRaidKeyBlueprint": {
        resultType: "/Lotus/Types/Keys/RaidKeys/Raid01Stage01KeyItem",
        buildPrice: 5000,
        buildTime: 21600,
        skipBuildTimePrice: 15,
        consumeOnUse: false,
        num: 1,
        codexSecret: false,
        ingredients: [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Rubedo",
                ItemCount: 500
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Nanospores",
                ItemCount: 9000
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Gallium",
                ItemCount: 1
            }
        ],
        excludeFromMarket: true,
        tradable: false,
        creditsCost: 100000
    },
    // The Law of Retribution (Nightmare) raid bp. Removed in 22.14.0
    "/Lotus/Types/Keys/NightmareGrineerRaidKeyBlueprint": {
        resultType: "/Lotus/Types/Keys/RaidKeys/Raid01Stage01NightmareKeyItem",
        buildPrice: 5000,
        buildTime: 21600,
        skipBuildTimePrice: 15,
        consumeOnUse: false,
        num: 1,
        codexSecret: false,
        ingredients: [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Rubedo",
                ItemCount: 1000
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Nanospores",
                ItemCount: 18000
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Gallium",
                ItemCount: 2
            }
        ],
        excludeFromMarket: true,
        tradable: false,
        creditsCost: 100000
    },
    // The Jordas Verdict raid bp. Removed in 22.14.0
    "/Lotus/Types/Keys/GolemRaidKeyBlueprint": {
        resultType: "/Lotus/Types/Keys/RaidKeys/RaidGolemStage01KeyItem",
        buildPrice: 5000,
        buildTime: 21600,
        skipBuildTimePrice: 15,
        consumeOnUse: false,
        num: 1,
        codexSecret: false,
        ingredients: [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Plastids",
                ItemCount: 2000
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Nanospores",
                ItemCount: 12000
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Neurode",
                ItemCount: 2
            }
        ],
        excludeFromMarket: true,
        tradable: false,
        creditsCost: 100000
    },
    // Orokin Derelict Assassination bp for Lephantis. Removed in 28.3.0
    "/Lotus/Types/Keys/GolemKeyBlueprint": {
        resultType: "/Lotus/Types/Keys/DerelictGolemKey",
        buildPrice: 7500,
        buildTime: 3600,
        skipBuildTimePrice: 10,
        consumeOnUse: false,
        num: 1,
        codexSecret: false,
        ingredients: [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/BossNavCode",
                ItemCount: 5
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Nanospores",
                ItemCount: 4000
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Salvage",
                ItemCount: 1000
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Circuits",
                ItemCount: 100
            }
        ],
        excludeFromMarket: true,
        tradable: false,
        creditsCost: 2500
    },
    // Orokin Derelict Capture bp. Removed in 28.3.0
    "/Lotus/Types/Keys/DerelictCaptureKeyBlueprint": {
        resultType: "/Lotus/Types/Keys/DerelictCaptureKey",
        buildPrice: 6500,
        buildTime: 60,
        skipBuildTimePrice: 5,
        consumeOnUse: false,
        num: 1,
        codexSecret: false,
        ingredients: [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/NavCode",
                ItemCount: 5
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Nanospores",
                ItemCount: 2500
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Ferrite",
                ItemCount: 750
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Circuits",
                ItemCount: 80
            }
        ],
        excludeFromMarket: true,
        tradable: false,
        creditsCost: 1500
    },
    // Orokin Derelict Defense bp. Removed in 28.3.0
    "/Lotus/Types/Keys/DerelictDefenseKeyBlueprint": {
        resultType: "/Lotus/Types/Keys/DerelictDefenseKey",
        buildPrice: 6500,
        buildTime: 60,
        skipBuildTimePrice: 5,
        consumeOnUse: false,
        num: 1,
        codexSecret: false,
        ingredients: [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/NavCode",
                ItemCount: 5
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Nanospores",
                ItemCount: 2500
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Salvage",
                ItemCount: 750
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/PolymerBundle",
                ItemCount: 80
            }
        ],
        excludeFromMarket: true,
        tradable: false,
        creditsCost: 1500
    },
    // Orokin Derelict Exterminate bp. Removed in 28.3.0
    "/Lotus/Types/Keys/DerelictExterminateKeyBlueprint": {
        resultType: "/Lotus/Types/Keys/DerelictExterminateKey",
        buildPrice: 6500,
        buildTime: 60,
        skipBuildTimePrice: 5,
        consumeOnUse: false,
        num: 1,
        codexSecret: false,
        ingredients: [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/NavCode",
                ItemCount: 5
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Nanospores",
                ItemCount: 2500
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Salvage",
                ItemCount: 750
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Circuits",
                ItemCount: 80
            }
        ],
        excludeFromMarket: true,
        tradable: false,
        creditsCost: 1500
    },
    // Orokin Derelict Mobile Defense bp. Removed in 28.3.0
    "/Lotus/Types/Keys/DerelictMobileDefenseKeyBlueprint": {
        resultType: "/Lotus/Types/Keys/DerelictMobileDefenseKey",
        buildPrice: 6500,
        buildTime: 60,
        skipBuildTimePrice: 5,
        consumeOnUse: false,
        num: 1,
        codexSecret: false,
        ingredients: [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/NavCode",
                ItemCount: 5
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Nanospores",
                ItemCount: 2500
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Ferrite",
                ItemCount: 750
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/PolymerBundle",
                ItemCount: 80
            }
        ],
        excludeFromMarket: true,
        tradable: false,
        creditsCost: 1500
    },
    // Orokin Derelict Sabotage bp. Removed in 28.3.0
    "/Lotus/Types/Keys/DerelictSabotageKeyBlueprint": {
        resultType: "/Lotus/Types/Keys/DerelictSabotageKey",
        buildPrice: 6500,
        buildTime: 60,
        skipBuildTimePrice: 5,
        consumeOnUse: false,
        num: 1,
        codexSecret: false,
        ingredients: [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/NavCode",
                ItemCount: 5
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Nanospores",
                ItemCount: 2500
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Ferrite",
                ItemCount: 750
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/PolymerBundle",
                ItemCount: 80
            }
        ],
        excludeFromMarket: true,
        tradable: false,
        creditsCost: 1500
    },
    // Orokin Derelict Survival bp. Removed in 28.3.0
    "/Lotus/Types/Keys/DerelictSurvivalKeyBlueprint": {
        resultType: "/Lotus/Types/Keys/DerelictSurvivalKey",
        buildPrice: 6500,
        buildTime: 60,
        skipBuildTimePrice: 5,
        consumeOnUse: false,
        num: 1,
        codexSecret: false,
        ingredients: [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/NavCode",
                ItemCount: 5
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Nanospores",
                ItemCount: 2500
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Salvage",
                ItemCount: 750
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Circuits",
                ItemCount: 80
            }
        ],
        excludeFromMarket: true,
        tradable: false,
        creditsCost: 1500
    },
    // Vay Hek Frequency Triangulator (Assassination key) bp. Removed in 15.13.0
    "/Lotus/Types/Keys/VeyHekKeyBlueprint": {
        resultType: "/Lotus/Types/Keys/VeyHekKey",
        buildPrice: 20000,
        buildTime: 3600,
        skipBuildTimePrice: 10,
        consumeOnUse: false,
        num: 1,
        codexSecret: false,
        ingredients: [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/VayHekCoordinateFragmentA",
                ItemCount: 2
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/VayHekCoordinateFragmentB",
                ItemCount: 4
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/VayHekCoordinateFragmentC",
                ItemCount: 8
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/VayHekCoordinateFragmentD",
                ItemCount: 12
            }
        ],
        excludeFromMarket: true,
        tradable: false,
        creditsCost: 10000
    },
    "/Lotus/Types/Recipes/KevinTestRecipe": {
        resultType: "/Lotus/Upgrades/Modules/Crafted/IncendiaryRifleMod",
        buildPrice: 1000,
        buildTime: 180,
        skipBuildTimePrice: 10,
        consumeOnUse: false,
        num: 1,
        codexSecret: false,
        ingredients: [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Actuator",
                ItemCount: 1
            },
            {
                ItemType: "/Lotus/Weapons/Tenno/Pistol/LotusPistol",
                ItemCount: 1
            }
        ],
        tradable: false
    },
    "/Lotus/Types/Recipes/IncendiaryRifleModBlueprint": {
        resultType: "/Lotus/Upgrades/Modules/Crafted/IncendiaryRifleMod",
        buildPrice: 6000,
        buildTime: 43200,
        skipBuildTimePrice: 10,
        consumeOnUse: true,
        num: 1,
        codexSecret: false,
        ingredients: [
            {
                ItemType: "/Lotus/Upgrades/Modules/GrineerRifleModule",
                ItemCount: 1
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Ferrite",
                ItemCount: 500
            },
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Rubedo",
                ItemCount: 50
            }
        ],
        tradable: false
    }
};

interface IU5FingerprintData {
    fits: { Type: string; rarity: TRarity; StatAtten?: number }[];
    upgrades: IU5FingerprintUpgrade[];
}

interface IU5FingerprintUpgrade {
    UpgradeType: string;
    ValueRanges: Record<Exclude<TRarity, "LEGENDARY">, [number, number]>;
    rarity: TRarity;
}

const U5WeaponUpgrades: IU5FingerprintUpgrade[] = [
    {
        UpgradeType: "WEAPON_DAMAGE_AMOUNT",
        ValueRanges: {
            COMMON: [1.015, 1.15],
            UNCOMMON: [1.05, 1.25],
            RARE: [1.1, 1.5]
        },
        rarity: "COMMON"
    },
    {
        UpgradeType: "WEAPON_FIRE_DAMAGE",
        ValueRanges: {
            COMMON: [0.015, 0.15000001],
            UNCOMMON: [0.050000001, 0.25],
            RARE: [0.1, 0.5]
        },
        rarity: "RARE"
    },
    {
        UpgradeType: "WEAPON_ELECTRICITY_DAMAGE",
        ValueRanges: {
            COMMON: [0.015, 0.15000001],
            UNCOMMON: [0.050000001, 0.25],
            RARE: [0.1, 0.5]
        },
        rarity: "COMMON"
    },
    {
        UpgradeType: "WEAPON_FREEZE_DAMAGE",
        ValueRanges: {
            COMMON: [0.015, 0.15000001],
            UNCOMMON: [0.050000001, 0.25],
            RARE: [0.1, 0.5]
        },
        rarity: "COMMON"
    },
    {
        UpgradeType: "WEAPON_ARMOR_PIERCING_DAMAGE",
        ValueRanges: {
            COMMON: [0.015, 0.15000001],
            UNCOMMON: [0.050000001, 0.25],
            RARE: [0.1, 0.5]
        },
        rarity: "COMMON"
    },
    {
        UpgradeType: "WEAPON_STUN_CHANCE",
        ValueRanges: {
            COMMON: [0.025, 0.1],
            UNCOMMON: [0.050000001, 0.2],
            RARE: [0.1, 0.40000001]
        },
        rarity: "UNCOMMON"
    },
    {
        UpgradeType: "WEAPON_CLIP_MAX",
        ValueRanges: {
            COMMON: [1.05, 1.35],
            UNCOMMON: [1.1, 1.5],
            RARE: [1.15, 2]
        },
        rarity: "UNCOMMON"
    },
    {
        UpgradeType: "WEAPON_FIRE_ITERATIONS",
        ValueRanges: {
            COMMON: [1.25, 1.75],
            UNCOMMON: [1.5, 2],
            RARE: [2, 4]
        },
        rarity: "RARE"
    },
    {
        UpgradeType: "WEAPON_PUNCTURE_DEPTH",
        ValueRanges: {
            COMMON: [2, 5],
            UNCOMMON: [2, 10],
            RARE: [3, 15]
        },
        rarity: "RARE"
    },
    {
        UpgradeType: "WEAPON_AMMO_MAX",
        ValueRanges: {
            COMMON: [1.05, 1.5],
            UNCOMMON: [1.1, 1.75],
            RARE: [1.15, 2]
        },
        rarity: "UNCOMMON"
    },
    {
        UpgradeType: "WEAPON_RELOAD_SPEED",
        ValueRanges: {
            COMMON: [1.05, 1.5],
            UNCOMMON: [1.075, 1.75],
            RARE: [1.1, 2]
        },
        rarity: "UNCOMMON"
    },
    {
        UpgradeType: "WEAPON_FIRE_RATE",
        ValueRanges: {
            COMMON: [1.01, 1.2],
            UNCOMMON: [1.05, 1.5],
            RARE: [1.1, 1.75]
        },
        rarity: "UNCOMMON"
    },
    {
        UpgradeType: "WEAPON_CRIT_CHANCE",
        ValueRanges: {
            COMMON: [0.0099999998, 0.1],
            UNCOMMON: [0.025, 0.15000001],
            RARE: [0.050000001, 0.2]
        },
        rarity: "COMMON"
    },
    {
        UpgradeType: "WEAPON_CRIT_DAMAGE",
        ValueRanges: {
            COMMON: [0.1, 0.5],
            UNCOMMON: [0.2, 1],
            RARE: [0.30000001, 1.5]
        },
        rarity: "COMMON"
    }
];

// couldn't find actual weights
export const U5ModsWeights: Record<TRarity, number> = {
    COMMON: 0.75,
    UNCOMMON: 0.2,
    RARE: 0.05,
    LEGENDARY: 0
};

export const U5Modules: Record<string, IU5FingerprintData> = {
    "/Lotus/Upgrades/Modules/Crafted/IncendiaryRifleMod": {
        fits: [
            {
                Type: "/Lotus/Weapons/Tenno/Rifle/Rifle",
                rarity: "COMMON"
            }
        ],
        upgrades: [
            {
                UpgradeType: "WEAPON_FIRE_DAMAGE",
                ValueRanges: {
                    COMMON: [0.025, 0.30000001],
                    UNCOMMON: [0.050000001, 0.40000001],
                    RARE: [0.1, 0.69999999]
                },
                rarity: "COMMON"
            }
        ]
    },
    "/Lotus/Upgrades/Modules/GrineerMeleeModule": {
        fits: [
            {
                Type: "/Lotus/Weapons/Tenno/Melee/DualShortSword/DualShortSword",
                rarity: "UNCOMMON"
            },
            {
                Type: "/Lotus/Weapons/Tenno/Melee/LongSword/LongSword",
                rarity: "UNCOMMON"
            },
            {
                Type: "/Lotus/Weapons/Tenno/Melee/Staff/Staff",
                rarity: "UNCOMMON"
            },
            {
                Type: "/Lotus/Types/Game/LotusMeleeWeapon",
                rarity: "COMMON"
            },
            {
                Type: "/Lotus/Weapons/Tenno/Melee/Fist/Fist",
                rarity: "UNCOMMON"
            },
            {
                Type: "/Lotus/Weapons/Tenno/Melee/Dagger/Dagger",
                rarity: "UNCOMMON"
            }
        ],
        upgrades: [
            {
                UpgradeType: "WEAPON_MELEE_DAMAGE",
                ValueRanges: {
                    COMMON: [1.05, 1.15],
                    UNCOMMON: [1.075, 1.25],
                    RARE: [1.15, 1.5]
                },
                rarity: "COMMON"
            },
            {
                UpgradeType: "WEAPON_FIRE_DAMAGE",
                ValueRanges: {
                    COMMON: [0.050000001, 0.15000001],
                    UNCOMMON: [0.075000003, 0.25],
                    RARE: [0.1, 0.5]
                },
                rarity: "RARE"
            },
            {
                UpgradeType: "WEAPON_ELECTRICITY_DAMAGE",
                ValueRanges: {
                    COMMON: [0.050000001, 0.15000001],
                    UNCOMMON: [0.075000003, 0.25],
                    RARE: [0.1, 0.5]
                },
                rarity: "COMMON"
            },
            {
                UpgradeType: "WEAPON_FREEZE_DAMAGE",
                ValueRanges: {
                    COMMON: [0.050000001, 0.15000001],
                    UNCOMMON: [0.075000003, 0.25],
                    RARE: [0.1, 0.5]
                },
                rarity: "COMMON"
            },
            {
                UpgradeType: "WEAPON_ARMOR_PIERCING_DAMAGE",
                ValueRanges: {
                    COMMON: [0.050000001, 0.15000001],
                    UNCOMMON: [0.075000003, 0.25],
                    RARE: [0.1, 0.5]
                },
                rarity: "COMMON"
            },
            {
                UpgradeType: "WEAPON_STUN_CHANCE",
                ValueRanges: {
                    COMMON: [0.050000001, 0.1],
                    UNCOMMON: [0.1, 0.2],
                    RARE: [0.2, 0.40000001]
                },
                rarity: "UNCOMMON"
            },
            {
                UpgradeType: "WEAPON_CRIT_CHANCE",
                ValueRanges: {
                    COMMON: [0.0099999998, 0.1],
                    UNCOMMON: [0.02, 0.15000001],
                    RARE: [0.050000001, 0.25]
                },
                rarity: "COMMON"
            },
            {
                UpgradeType: "WEAPON_CRIT_DAMAGE",
                ValueRanges: {
                    COMMON: [0.050000001, 1],
                    UNCOMMON: [0.1, 1.5],
                    RARE: [0.2, 2]
                },
                rarity: "COMMON"
            },
            {
                UpgradeType: "WEAPON_MELEE_HEAVY_DAMAGE",
                ValueRanges: {
                    COMMON: [1.025, 1.25],
                    UNCOMMON: [1.05, 1.5],
                    RARE: [1.15, 1.75]
                },
                rarity: "UNCOMMON"
            },
            {
                UpgradeType: "WEAPON_MELEE_CHARGE_RATE",
                ValueRanges: {
                    COMMON: [0.025, 0.30000001],
                    UNCOMMON: [0.050000001, 0.40000001],
                    RARE: [0.1, 0.5]
                },
                rarity: "UNCOMMON"
            },
            {
                UpgradeType: "WEAPON_FIRE_RATE",
                ValueRanges: {
                    COMMON: [1.05, 1.15],
                    UNCOMMON: [1.075, 1.35],
                    RARE: [1.1, 1.5]
                },
                rarity: "UNCOMMON"
            }
        ]
    },
    "/Lotus/Upgrades/Modules/GrineerPistolModule": {
        fits: [
            {
                Type: "/Lotus/Weapons/Tenno/Pistol/LotusPistol",
                rarity: "COMMON"
            },
            {
                Type: "/Lotus/Weapons/Tenno/Pistol/AutoPistol",
                rarity: "RARE"
            },
            {
                Type: "/Lotus/Weapons/Tenno/Pistol/BurstPistol",
                rarity: "UNCOMMON"
            },
            {
                Type: "/Lotus/Weapons/Tenno/Pistol/CrossBow",
                rarity: "UNCOMMON"
            },
            {
                Type: "/Lotus/Weapons/Tenno/Pistol/HandShotGun",
                rarity: "UNCOMMON"
            },
            {
                Type: "/Lotus/Weapons/Tenno/Pistol/Pistol",
                rarity: "UNCOMMON"
            }
        ],
        upgrades: U5WeaponUpgrades
    },
    "/Lotus/Upgrades/Modules/GrineerRifleModule": {
        fits: [
            {
                Type: "/Lotus/Weapons/Tenno/Rifle/LotusRifle",
                rarity: "COMMON"
            },
            {
                Type: "/Lotus/Weapons/Tenno/Rifle/BurstRifle",
                rarity: "UNCOMMON",
                StatAtten: 1.2
            },
            {
                Type: "/Lotus/Weapons/Tenno/Rifle/SniperRifle",
                rarity: "RARE",
                StatAtten: 1.1
            },
            {
                Type: "/Lotus/Weapons/Tenno/Rifle/HeavyRifle",
                rarity: "RARE",
                StatAtten: 1.3
            },
            {
                Type: "/Lotus/Weapons/Tenno/Rifle/Rifle",
                rarity: "UNCOMMON",
                StatAtten: 1.2
            },
            {
                Type: "/Lotus/Weapons/Tenno/Rifle/SemiAutoRifle",
                rarity: "UNCOMMON",
                StatAtten: 1.1
            }
        ],
        upgrades: U5WeaponUpgrades
    },
    "/Lotus/Upgrades/Modules/GrineerShotgunModule": {
        fits: [
            {
                Type: "/Lotus/Weapons/Tenno/Shotgun/LotusShotgun",
                rarity: "COMMON",
                StatAtten: 1
            },
            {
                Type: "/Lotus/Weapons/Tenno/Shotgun/Shotgun",
                rarity: "UNCOMMON",
                StatAtten: 1.2
            },
            {
                Type: "/Lotus/Weapons/Tenno/Shotgun/FullAutoShotgun",
                rarity: "RARE",
                StatAtten: 1.1
            }
        ],
        upgrades: U5WeaponUpgrades
    },
    "/Lotus/Upgrades/Modules/OrokinWarframeModule": {
        fits: [
            {
                Type: "/Lotus/Types/Game/PowerSuit",
                rarity: "COMMON"
            },
            {
                Type: "/Lotus/Powersuits/Ember/Ember",
                rarity: "UNCOMMON",
                StatAtten: 1.2
            },
            {
                Type: "/Lotus/Powersuits/Excalibur/Excalibur",
                rarity: "UNCOMMON",
                StatAtten: 1.1
            },
            {
                Type: "/Lotus/Powersuits/Loki/Loki",
                rarity: "UNCOMMON",
                StatAtten: 1.1
            },
            {
                Type: "/Lotus/Powersuits/Mag/Mag",
                rarity: "UNCOMMON",
                StatAtten: 1.1
            },
            {
                Type: "/Lotus/Powersuits/Ninja/Ninja",
                rarity: "UNCOMMON",
                StatAtten: 1.1
            },
            {
                Type: "/Lotus/Powersuits/Rhino/Rhino",
                rarity: "UNCOMMON",
                StatAtten: 1.1
            },
            {
                Type: "/Lotus/Powersuits/Trinity/Trinity",
                rarity: "UNCOMMON",
                StatAtten: 1.1
            },
            {
                Type: "/Lotus/Powersuits/Volt/Volt",
                rarity: "UNCOMMON",
                StatAtten: 1.1
            }
        ],
        upgrades: [
            {
                UpgradeType: "AVATAR_SHIELD_MAX",
                ValueRanges: {
                    COMMON: [1.05, 1.4],
                    UNCOMMON: [1.1, 1.7],
                    RARE: [1.2, 2]
                },
                rarity: "COMMON"
            },
            {
                UpgradeType: "AVATAR_ARMOUR",
                ValueRanges: {
                    COMMON: [1.05, 1.4],
                    UNCOMMON: [1.1, 1.7],
                    RARE: [1.2, 2]
                },
                rarity: "COMMON"
            },
            {
                UpgradeType: "AVATAR_HEALTH_MAX",
                ValueRanges: {
                    COMMON: [1.1, 1.4],
                    UNCOMMON: [1.15, 1.8],
                    RARE: [1.2, 2]
                },
                rarity: "UNCOMMON"
            },
            {
                UpgradeType: "AVATAR_POWER_MAX",
                ValueRanges: {
                    COMMON: [1.05, 1.4],
                    UNCOMMON: [1.1, 1.75],
                    RARE: [1.15, 2]
                },
                rarity: "RARE"
            },
            {
                UpgradeType: "AVATAR_SHIELD_RECHARGE_RATE",
                ValueRanges: {
                    COMMON: [1.05, 1.4],
                    UNCOMMON: [1.1, 1.75],
                    RARE: [1.15, 2]
                },
                rarity: "UNCOMMON"
            },
            {
                UpgradeType: "WEAPON_MELEE_DAMAGE",
                ValueRanges: {
                    COMMON: [1.05, 1.4],
                    UNCOMMON: [1.1, 1.75],
                    RARE: [1.15, 2]
                },
                rarity: "UNCOMMON"
            },
            {
                UpgradeType: "AVATAR_SPRINT_SPEED",
                ValueRanges: {
                    COMMON: [1.03, 1.1],
                    UNCOMMON: [1.05, 1.25],
                    RARE: [1.1, 1.35]
                },
                rarity: "UNCOMMON"
            },
            {
                UpgradeType: "AVATAR_ENEMY_RADAR",
                ValueRanges: {
                    COMMON: [15, 20],
                    UNCOMMON: [20, 40],
                    RARE: [25, 60]
                },
                rarity: "RARE"
            },
            {
                UpgradeType: "AVATAR_LOOT_RADAR",
                ValueRanges: {
                    COMMON: [15, 20],
                    UNCOMMON: [20, 40],
                    RARE: [25, 60]
                },
                rarity: "UNCOMMON"
            },
            {
                UpgradeType: "AVATAR_ABILITY_RANGE",
                ValueRanges: {
                    COMMON: [1.05, 1.4],
                    UNCOMMON: [1.1, 1.5],
                    RARE: [1.15, 1.8]
                },
                rarity: "UNCOMMON"
            },
            {
                UpgradeType: "AVATAR_ABILITY_DURATION",
                ValueRanges: {
                    COMMON: [1.02, 1.3],
                    UNCOMMON: [1.05, 1.4],
                    RARE: [1.05, 1.5]
                },
                rarity: "RARE"
            },
            {
                UpgradeType: "AVATAR_ABILITY_EFFICIENCY",
                ValueRanges: {
                    COMMON: [1.03, 1.3],
                    UNCOMMON: [1.05, 1.5],
                    RARE: [1.1, 1.7]
                },
                rarity: "RARE"
            },
            {
                UpgradeType: "AVATAR_ABILITY_STRENGTH",
                ValueRanges: {
                    COMMON: [1.03, 1.4],
                    UNCOMMON: [1.05, 1.5],
                    RARE: [1.1, 1.7]
                },
                rarity: "RARE"
            }
        ]
    }
};

export const getRecipe = (uniqueName: string): IRecipe | undefined => {
    return ExportRecipes[uniqueName] ?? supplementalRecipes[uniqueName];
};

export const getSyndicate = (tag: string, buildLabel: string | undefined): ISyndicate | undefined => {
    if (tag == "EntratiSyndicate" && buildLabel && version_compare(buildLabel, gameToBuildVersion["41.0.0"]) < 0) {
        return EntratiSyndicate_pre_U41 as ISyndicate;
    }
    return ExportSyndicates[tag];
};

export const getRecipeByResult = (resultType: string): IRecipe | undefined => {
    return Object.values(ExportRecipes).find(x => x.resultType == resultType);
};

export const getItemCategoryByUniqueName = (uniqueName: string): string | undefined => {
    if (uniqueName in ExportCustoms) {
        return ExportCustoms[uniqueName].productCategory;
    }
    if (uniqueName in ExportDrones) {
        return "Drones";
    }
    if (uniqueName in ExportKeys) {
        return "LevelKeys";
    }
    if (uniqueName in ExportGear) {
        return "Consumables";
    }
    if (uniqueName in ExportResources) {
        return ExportResources[uniqueName].productCategory;
    }
    if (uniqueName in ExportSentinels) {
        return ExportSentinels[uniqueName].productCategory;
    }
    if (uniqueName in ExportWarframes) {
        return ExportWarframes[uniqueName].productCategory;
    }
    if (uniqueName in ExportWeapons) {
        return ExportWeapons[uniqueName].productCategory;
    }
    return undefined;
};

export const getItemName = (uniqueName: string): string | undefined => {
    if (uniqueName in ExportArcanes) {
        return ExportArcanes[uniqueName].name;
    }
    if (uniqueName in ExportBundles) {
        return ExportBundles[uniqueName].name;
    }
    if (uniqueName in ExportCustoms) {
        return ExportCustoms[uniqueName].name;
    }
    if (uniqueName in ExportDrones) {
        return ExportDrones[uniqueName].name;
    }
    if (uniqueName in ExportKeys) {
        return ExportKeys[uniqueName].name;
    }
    if (uniqueName in ExportGear) {
        return ExportGear[uniqueName].name;
    }
    if (uniqueName in ExportResources) {
        return ExportResources[uniqueName].name;
    }
    if (uniqueName in ExportSentinels) {
        return ExportSentinels[uniqueName].name;
    }
    if (uniqueName in ExportWarframes) {
        return ExportWarframes[uniqueName].name;
    }
    if (uniqueName in ExportWeapons) {
        return ExportWeapons[uniqueName].name;
    }
    if (uniqueName in ExportRailjackWeapons) {
        return ExportRailjackWeapons[uniqueName].name;
    }
    if (uniqueName in ExportDojoRecipes.colours) {
        return ExportDojoRecipes.colours[uniqueName].name;
    }
    if (uniqueName in ExportDojoRecipes.backdrops) {
        return ExportDojoRecipes.backdrops[uniqueName].name;
    }
    if (uniqueName in ExportDojoRecipes.decos) {
        return ExportDojoRecipes.decos[uniqueName].name;
    }
    return undefined;
};

export const getDict = (lang: string): Record<string, string> => {
    switch (lang) {
        case "de":
            return dict_de;
        case "es":
            return dict_es;
        case "fr":
            return dict_fr;
        case "it":
            return dict_it;
        case "ja":
            return dict_ja;
        case "ko":
            return dict_ko;
        case "pl":
            return dict_pl;
        case "pt":
            return dict_pt;
        case "ru":
            return dict_ru;
        case "tc":
            return dict_tc;
        case "th":
            return dict_th;
        case "tr":
            return dict_tr;
        case "uk":
            return dict_uk;
        case "zh":
            return dict_zh;
    }
    return dict_en;
};

export const getString = (key: string, dict: Record<string, string>): string => {
    return dict[key] ?? key;
};

export const getNormalizedString = (key: string, dict: Record<string, string>): string => {
    return getString(key, dict).split("‘").join("'").split("’").join("'").split("\r\n").join(" ");
};

export const getKeyChainItems = (
    { KeyChain, ChainStage }: IKeyChainRequest,
    buildLabel: string | undefined
): string[] => {
    const chainStages = getKey(KeyChain, buildLabel)?.chainStages;
    if (!chainStages) {
        throw new Error(`KeyChain ${KeyChain} does not contain chain stages`);
    }

    const keyChainStage = chainStages[ChainStage];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!keyChainStage) {
        throw new Error(`KeyChainStage ${ChainStage} not found`);
    }

    if (keyChainStage.itemsToGiveWhenTriggered.length === 0) {
        throw new Error(
            `client requested key chain items in KeyChain ${KeyChain} at stage ${ChainStage}, but they did not exist`
        );
    }

    return keyChainStage.itemsToGiveWhenTriggered;
};

export const getLevelKeyRewards = (
    levelKey: string,
    buildLabel: string | undefined
): { levelKeyRewards?: IMissionReward; levelKeyRewards2?: TReward[]; levelMission?: Partial<IRegion> } => {
    const key = getKey(levelKey);

    const levelKeyRewards = key?.missionReward;
    let levelKeyRewards2 = key?.rewards;
    const levelMission = key?.mission;

    if (!levelKeyRewards && !levelKeyRewards2 && !levelMission) {
        logger.warn(
            `Could not find any reward information for ${levelKey}, gonna have to potentially short-change you`
        );
    }

    if (buildLabel && version_compare(buildLabel, gameToBuildVersion["40.0.0"]) < 0) {
        if (levelKey in vorsPrizePreU40Rewards) {
            levelKeyRewards2 = vorsPrizePreU40Rewards[levelKey as keyof typeof vorsPrizePreU40Rewards] as TReward[];
        } else {
            // Before U19 (Hotfix: Specters of the Rail 0.12, 2016-07-20), The New Strange gave Chroma component blueprints more directly.
            if (buildLabel && version_compare(buildLabel, "2016.07.20.00.00") < 0) {
                if (levelKey == "/Lotus/Types/Keys/DragonQuest/DragonQuestMissionTwo") {
                    levelKeyRewards2 = [
                        {
                            rewardType: "RT_STORE_ITEM",
                            itemType: "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/ChromaHelmetBlueprint"
                        }
                    ];
                } else if (levelKey == "/Lotus/Types/Keys/DragonQuest/DragonQuestMissionThree") {
                    levelKeyRewards2 = [
                        {
                            rewardType: "RT_STORE_ITEM",
                            itemType: "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/ChromaSystemsBlueprint"
                        }
                    ];
                }
            }
        }
    }

    return {
        levelKeyRewards,
        levelKeyRewards2,
        levelMission
    };
};

export const getKeyChainMessage = ({ KeyChain, ChainStage }: IKeyChainRequest): IMessage => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const chainStages = ExportKeys[KeyChain]?.chainStages;
    if (!chainStages) {
        throw new Error(`KeyChain ${KeyChain} does not contain chain stages`);
    }

    let i = ChainStage;
    let chainStageMessage = chainStages[i].messageToSendWhenTriggered;
    while (!chainStageMessage) {
        if (++i >= chainStages.length) {
            break;
        }
        chainStageMessage = chainStages[i].messageToSendWhenTriggered;
    }

    if (!chainStageMessage) {
        throw new Error(
            `client requested key chain message in keychain ${KeyChain} at stage ${ChainStage} but they did not exist`
        );
    }
    return convertInboxMessage(chainStageMessage);
};

export const convertInboxMessage = (message: IInboxMessage): IMessage => {
    return {
        sndr: message.sender,
        msg: message.body,
        cinematic: message.cinematic,
        sub: message.title,
        customData: message.customData,
        att: message.attachments.length > 0 ? message.attachments : undefined,
        countedAtt: message.countedAttachments.length > 0 ? message.countedAttachments : undefined,
        icon: message.icon ?? "",
        transmission: message.transmission ?? "",
        highPriority: message.highPriority ?? false,
        r: false
    } satisfies IMessage;
};

export const isStoreItem = (type: string): boolean => {
    return type.startsWith("/Lotus/StoreItems/") || type in ExportBoosters;
};

export const toStoreItem = (type: string): string => {
    if (type.startsWith("/Lotus/Types/Boosters/")) {
        const boosterEntry = Object.entries(ExportBoosters).find(arr => arr[1].typeName == type);
        if (boosterEntry) {
            return boosterEntry[0];
        }
        throw new Error(`could not convert ${type} to a store item`);
    }
    return "/Lotus/StoreItems/" + type.substring("/Lotus/".length);
};

export const fromStoreItem = (type: string): string => {
    if (type.startsWith("/Lotus/StoreItems/")) {
        return "/Lotus/" + type.substring("/Lotus/StoreItems/".length);
    }

    if (type in ExportBoosters) {
        return ExportBoosters[type].typeName;
    }

    throw new Error(`${type} is not a store item`);
};

export const getDefaultUpgrades = (parts: string[]): IDefaultUpgrade[] | undefined => {
    const allDefaultUpgrades: IDefaultUpgrade[] = [];
    for (const part of parts) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const defaultUpgrades = ExportWeapons[part]?.defaultUpgrades;
        if (defaultUpgrades) {
            allDefaultUpgrades.push(...defaultUpgrades);
        }
    }
    return allDefaultUpgrades.length == 0 ? undefined : allDefaultUpgrades;
};

export const getMaxLevelCap = (type: string): number => {
    if (type in ExportWarframes) {
        return ExportWarframes[type].maxLevelCap ?? 30;
    }
    if (type in ExportWeapons) {
        return ExportWeapons[type].maxLevelCap ?? 30;
    }
    return 30;
};

export const getProductCategory = (uniqueName: string): string => {
    if (uniqueName in ExportCustoms) {
        return ExportCustoms[uniqueName].productCategory;
    }
    if (uniqueName in ExportGear) {
        return "Consumables";
    }
    if (uniqueName in ExportResources) {
        return ExportResources[uniqueName].productCategory;
    }
    if (uniqueName in ExportWeapons) {
        return ExportWeapons[uniqueName].productCategory;
    }
    throw new Error(`don't know product category of ${uniqueName}`);
};

export const getBundle = (uniqueName: string, buildLabel: string = ""): IBundle | undefined => {
    if (buildLabel) {
        if (
            uniqueName == "/Lotus/Types/StoreItems/Packages/StalkerPack" &&
            version_compare(buildLabel, "2024.06.12.18.42") < 0 // < 36.0.0
        ) {
            return {
                name: "/Lotus/Language/Items/StalkerPackName",
                description: "/Lotus/Language/Items/StalkerPackDesc",
                icon: "/Lotus/Interface/Icons/StoreIcons/MarketBundles/Weapons/StalkerPack.png",
                components: [
                    { typeName: "/Lotus/StoreItems/Weapons/Tenno/Bows/StalkerBow", purchaseQuantity: 1 },
                    { typeName: "/Lotus/StoreItems/Weapons/Tenno/ThrowingWeapons/StalkerKunai", purchaseQuantity: 1 },
                    {
                        typeName: "/Lotus/StoreItems/Weapons/Tenno/Melee/Scythe/StalkerScytheWeapon",
                        purchaseQuantity: 1
                    },
                    {
                        typeName: "/Lotus/StoreItems/Types/StoreItems/SuitCustomizations/NinjaColourPickerItem",
                        purchaseQuantity: 1
                    }
                ],
                packageDiscount: 0.059
            };
        }
    }

    return ExportBundles[uniqueName];
};

export const getBoosterPack = (uniqueName: string, buildLabel: string = ""): IBoosterPack | undefined => {
    if (
        version_compare(buildLabel, gameToBuildVersion["18.16.0"]) < 0 &&
        uniqueName == "/Lotus/Types/BoosterPacks/RandomKey"
    ) {
        const boosterPack: IBoosterPack = {
            name: "/Lotus/Language/Items/RandomKey",
            description: "/Lotus/Language/Items/RandomKeyDesc",
            icon: "/Lotus/Interface/Icons/Store/OrokinKey.png",
            components: [
                { Item: "/Lotus/Types/Keys/OrokinKeyA", Rarity: "COMMON", Amount: 1 },
                { Item: "/Lotus/Types/Keys/OrokinKeyB", Rarity: "COMMON", Amount: 1 },
                { Item: "/Lotus/Types/Keys/OrokinKeyC", Rarity: "UNCOMMON", Amount: 1 },
                { Item: "/Lotus/Types/Keys/OrokinKeyD", Rarity: "UNCOMMON", Amount: 1 },
                { Item: "/Lotus/Types/Keys/OrokinKeyE", Rarity: "RARE", Amount: 1 }
            ],
            rarityWeightsPerRoll: [
                { COMMON: 1, UNCOMMON: 0.050000001, RARE: 0.0099999998, LEGENDARY: 0 },
                { COMMON: 1, UNCOMMON: 0.25, RARE: 0.050000001, LEGENDARY: 0 },
                { COMMON: 1, UNCOMMON: 0.25, RARE: 0.050000001, LEGENDARY: 0 },
                { COMMON: 1, UNCOMMON: 0.25, RARE: 0.050000001, LEGENDARY: 0 },
                { COMMON: 1, UNCOMMON: 0.25, RARE: 0.1, LEGENDARY: 0 }
            ],
            canGiveDuplicates: true,
            platinumCost: 75
        };
        if (buildLabel) {
            if (version_compare(buildLabel, "2013.06.07.23.44") >= 0) {
                boosterPack.rarityWeightsPerRoll[4] = { COMMON: 0, UNCOMMON: 0, RARE: 1, LEGENDARY: 0 };
            }
            if (version_compare(buildLabel, gameToBuildVersion["9.1.2"]) >= 0) {
                boosterPack.components.push(
                    { Item: "/Lotus/Types/Keys/OrokinCaptureKeyA", Rarity: "COMMON", Amount: 1 },
                    { Item: "/Lotus/Types/Keys/OrokinCaptureKeyB", Rarity: "COMMON", Amount: 1 },
                    { Item: "/Lotus/Types/Keys/OrokinCaptureKeyC", Rarity: "RARE", Amount: 1 },
                    { Item: "/Lotus/Types/Keys/OrokinMobileDefenseKeyA", Rarity: "COMMON", Amount: 1 },
                    { Item: "/Lotus/Types/Keys/OrokinMobileDefenseKeyB", Rarity: "UNCOMMON", Amount: 1 },
                    { Item: "/Lotus/Types/Keys/OrokinMobileDefenseKeyC", Rarity: "RARE", Amount: 1 },
                    { Item: "/Lotus/Types/Keys/OrokinDefenseKeyA", Rarity: "COMMON", Amount: 1 },
                    { Item: "/Lotus/Types/Keys/OrokinDefenseKeyB", Rarity: "UNCOMMON", Amount: 1 },
                    { Item: "/Lotus/Types/Keys/OrokinDefenseKeyC", Rarity: "RARE", Amount: 1 }
                );
            }
            if (version_compare(buildLabel, gameToBuildVersion["10.3.3"]) >= 0) {
                boosterPack.components.push({
                    Item: "/Lotus/Types/Keys/OrokinTowerSurvivalT3Key",
                    Rarity: "UNCOMMON",
                    Amount: 1
                });
            }
            if (version_compare(buildLabel, gameToBuildVersion["14.0.0"]) >= 0) {
                boosterPack.components.find(c => c.Item === "/Lotus/Types/Keys/OrokinTowerSurvivalT3Key")!.Rarity =
                    "RARE";
                boosterPack.components.push(
                    { Item: "/Lotus/Types/Keys/OrokinTowerKeys/OrokinTowerCaptureTier4Key", Rarity: "RARE", Amount: 1 },
                    { Item: "/Lotus/Types/Keys/OrokinTowerKeys/OrokinTowerDefenseTier4Key", Rarity: "RARE", Amount: 1 },
                    {
                        Item: "/Lotus/Types/Keys/OrokinTowerKeys/OrokinTowerExterminateTier4Key",
                        Rarity: "RARE",
                        Amount: 1
                    },
                    {
                        Item: "/Lotus/Types/Keys/OrokinTowerKeys/OrokinTowerInterceptionTier4Key",
                        Rarity: "RARE",
                        Amount: 1
                    },
                    {
                        Item: "/Lotus/Types/Keys/OrokinTowerKeys/OrokinTowerMobileDefenseTier4Key",
                        Rarity: "RARE",
                        Amount: 1
                    },
                    { Item: "/Lotus/Types/Keys/OrokinTowerKeys/OrokinTowerSurvivalTier4Key", Rarity: "RARE", Amount: 1 }
                );
            }
            if (version_compare(buildLabel, gameToBuildVersion["15.0.6"]) >= 0) {
                boosterPack.components.push(
                    {
                        Item: "/Lotus/Types/Keys/OrokinTowerKeys/OrokinTowerSabotageTier1Key",
                        Rarity: "COMMON",
                        Amount: 1
                    },
                    {
                        Item: "/Lotus/Types/Keys/OrokinTowerKeys/OrokinTowerSabotageTier2Key",
                        Rarity: "UNCOMMON",
                        Amount: 1
                    },
                    {
                        Item: "/Lotus/Types/Keys/OrokinTowerKeys/OrokinTowerSabotageTier3Key",
                        Rarity: "RARE",
                        Amount: 1
                    },
                    { Item: "/Lotus/Types/Keys/OrokinTowerKeys/OrokinTowerSabotageTier4Key", Rarity: "RARE", Amount: 1 }
                );
            }
        }
        return boosterPack;
    }
    if (version_compare(buildLabel, gameToBuildVersion["18.18.0"]) < 0) {
        if (
            [
                "/Lotus/Types/BoosterPacks/CommonFusionPack",
                "/Lotus/Types/BoosterPacks/PremiumUncommonFusionPack",
                "/Lotus/Types/BoosterPacks/PremiumRareFusionPack"
            ].includes(uniqueName)
        ) {
            return {
                ...ExportBoosterPacks[uniqueName],
                components: [
                    { Item: "/Lotus/Upgrades/Mods/Fusers/CommonModFuser", Rarity: "COMMON", Amount: 1 },
                    { Item: "/Lotus/Upgrades/Mods/Fusers/UncommonModFuser", Rarity: "UNCOMMON", Amount: 1 },
                    { Item: "/Lotus/Upgrades/Mods/Fusers/RareModFuser", Rarity: "RARE", Amount: 1 }
                ]
            };
        }
    }

    return ExportBoosterPacks[uniqueName];
};

export const getKey = (uniqueName: string, buildLabel?: string): IKey | undefined => {
    if (
        uniqueName == "/Lotus/Types/Keys/RaidKeys/Raid01Stage01KeyItem" ||
        uniqueName == "/Lotus/Types/Keys/RaidKeys/Raid01Stage01NightmareKeyItem"
    ) {
        return {
            name: "/Lotus/Language/Items/GrineerTrialsName",
            description: "/Lotus/Language/Items/GrineerTrialsDesc",
            icon: "/Lotus/Interface/Quests/GrineerRaidKeyChain.png",
            parentName: "/Lotus/Types/Keys/RaidKeys/BaseRaidKey",
            codexSecret: true,
            mission: {
                minEnemyLevel: 70,
                maxEnemyLevel: 80
            }
        };
    } else if (
        uniqueName == "/Lotus/Types/Keys/RaidKeys/Raid01Stage02KeyItem" ||
        uniqueName == "/Lotus/Types/Keys/RaidKeys/Raid01Stage02NightmareKeyItem"
    ) {
        return {
            name: "/Lotus/Language/Items/GrineerTrialsName",
            description: "/Lotus/Language/Items/GrineerTrialsDesc",
            icon: "/Lotus/Interface/Quests/GrineerRaidKeyChain.png",
            parentName: "/Lotus/Types/Keys/RaidKeys/BaseRaidKey",
            codexSecret: true,
            mission: {
                minEnemyLevel: 80,
                maxEnemyLevel: 90
            }
        };
    } else if (uniqueName == "/Lotus/Types/Keys/RaidKeys/Raid01Stage03KeyItem") {
        return {
            name: "/Lotus/Language/Items/GrineerTrialsName",
            description: "/Lotus/Language/Items/GrineerTrialsDesc",
            icon: "/Lotus/Interface/Quests/GrineerRaidKeyChain.png",
            parentName: "/Lotus/Types/Keys/RaidKeys/BaseRaidKey",
            codexSecret: true,
            missionReward: {
                credits: 200000,
                droptable: "/Lotus/Types/Game/MissionDecks/RaidRewards/HekRaid"
            },
            mission: {
                minEnemyLevel: 80,
                maxEnemyLevel: 100
            }
        };
    } else if (uniqueName == "/Lotus/Types/Keys/RaidKeys/Raid01Stage03NightmareKeyItem") {
        return {
            name: "/Lotus/Language/Items/GrineerNightmareTrialsName",
            description: "/Lotus/Language/Items/GrineerTrialsDesc",
            icon: "/Lotus/Interface/Quests/GrineerRaidKeyChain.png",
            parentName: "/Lotus/Types/Keys/RaidKeys/BaseRaidKey",
            codexSecret: true,
            missionReward: {
                credits: 250000,
                droptable: "/Lotus/Types/Game/MissionDecks/RaidRewards/NightmareHekRaid"
            },
            mission: {
                minEnemyLevel: 80,
                maxEnemyLevel: 100
            }
        };
    } else if (uniqueName == "/Lotus/Types/Keys/RaidKeys/RaidGolemStage01KeyItem") {
        return {
            name: "/Lotus/Language/Items/GolemTrialsName",
            description: "/Lotus/Language/Items/GolemTrialsDesc",
            icon: "/Lotus/Interface/Icons/Store/GolemRaidKey.png",
            parentName: "/Lotus/Types/Keys/RaidKeys/BaseRaidKey",
            codexSecret: true,
            mission: {
                minEnemyLevel: 86,
                maxEnemyLevel: 88
            }
        };
    } else if (uniqueName == "/Lotus/Types/Keys/RaidKeys/RaidGolemStage02KeyItem") {
        return {
            name: "/Lotus/Language/Items/GolemTrialsName",
            description: "/Lotus/Language/Items/GolemTrialsDesc",
            icon: "/Lotus/Interface/Icons/Store/GolemRaidKey.png",
            parentName: "/Lotus/Types/Keys/RaidKeys/BaseRaidKey",
            codexSecret: true,
            mission: {
                minEnemyLevel: 88,
                maxEnemyLevel: 92
            }
        };
    } else if (uniqueName == "/Lotus/Types/Keys/RaidKeys/RaidGolemStage03KeyItem") {
        return {
            name: "/Lotus/Language/Items/GolemTrialsName",
            description: "/Lotus/Language/Items/GolemTrialsDesc",
            icon: "/Lotus/Interface/Icons/Store/GolemRaidKey.png",
            parentName: "/Lotus/Types/Keys/RaidKeys/BaseRaidKey",
            codexSecret: true,
            missionReward: {
                credits: 300000,
                items: ["/Lotus/StoreItems/Upgrades/Mods/FusionBundles/RareFusionBundle"],
                droptable: "/Lotus/Types/Game/MissionDecks/RaidRewards/GolemRaid"
            },
            mission: {
                minEnemyLevel: 92,
                maxEnemyLevel: 97
            }
        };
    } else if (uniqueName == "/Lotus/Types/Keys/DerelictGolemKey") {
        return {
            name: "/Lotus/Language/Items/OrokinDerelictBossKey",
            description: "/Lotus/Language/Items/OrokinDerelictBossKeyDesc",
            icon: "/Lotus/Interface/Icons/Store/OrokinDerelictKey.png",
            parentName: "/Lotus/Types/Game/KeyItems/DerelictKeyItem",
            codexSecret: false,
            missionReward: {
                credits: 7500,
                droptable: "/Lotus/Types/Game/MissionDecks/GolemMissionRewards"
            },
            mission: {
                minEnemyLevel: 25,
                maxEnemyLevel: 35
            }
        };
    } else if (uniqueName == "/Lotus/Types/Keys/DerelictSabotageKey") {
        return {
            name: "/Lotus/Language/Items/OrokinDerelictSabotageKey",
            description: "/Lotus/Language/Items/OrokinDerelictSabotageKeyDesc",
            icon: "/Lotus/Interface/Icons/Store/OrokinDerelictKey.png",
            parentName: "/Lotus/Types/Game/KeyItems/DerelictKeyItem",
            codexSecret: false,
            cacheRewardManifest: "/Lotus/Types/Game/MissionDecks/OrokinDerelictSabotageRewards",
            mission: {
                minEnemyLevel: 25,
                maxEnemyLevel: 35
            }
        };
    } else if (uniqueName.startsWith("/Lotus/Types/Keys/Derelict")) {
        return {
            name: "/Lotus/Language/Items/OrokinDerelictCaptureKey",
            description: "/Lotus/Language/Items/OrokinDerelictCaptureKeyDesc",
            icon: "/Lotus/Interface/Icons/Store/OrokinDerelictKey.png",
            parentName: "/Lotus/Types/Game/KeyItems/DerelictKeyItem",
            codexSecret: false,
            mission: {
                minEnemyLevel: 25,
                maxEnemyLevel: 35
            }
        };
    } else if (uniqueName == "/Lotus/Types/Keys/DragonQuest/DragonQuestKeyChain") {
        // Before U19 (Hotfix: Specters of the Rail 0.12, 2016-07-20), The New Strange gave Chroma component blueprints more directly.
        if (buildLabel && version_compare(buildLabel, "2016.07.20.00.00") < 0) {
            const latestData = ExportKeys["/Lotus/Types/Keys/DragonQuest/DragonQuestKeyChain"];
            return {
                ...latestData,
                chainStages: latestData.chainStages!.map(chainStage => {
                    if ("itemsToGiveWhenTriggered" in chainStage && chainStage.itemsToGiveWhenTriggered.length == 1) {
                        if (
                            chainStage.itemsToGiveWhenTriggered[0] ==
                            "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/ChromaBeaconABlueprint"
                        ) {
                            return {
                                itemsToGiveWhenTriggered: [
                                    "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/ChromaChassisBlueprint"
                                ]
                            };
                        } else if (
                            chainStage.itemsToGiveWhenTriggered[0] ==
                                "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/ChromaBeaconBBlueprint" ||
                            chainStage.itemsToGiveWhenTriggered[0] ==
                                "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/ChromaBeaconCBlueprint"
                        ) {
                            return {
                                itemsToGiveWhenTriggered: []
                            };
                        }
                    }
                    return chainStage;
                })
            };
        }
    }

    return ExportKeys[uniqueName];
};

export const getMissionDeck = (uniqueName: string): TMissionDeck | undefined => {
    return ExportRewards[uniqueName];
};

export const getPrice = (
    storeItemName: string,
    quantity: number = 1,
    durability: number = 0,
    usePremium: boolean,
    buildLabel: string
): number => {
    const isBundle = storeItemName in ExportBundles;
    const internalName = isBundle ? storeItemName : fromStoreItem(storeItemName);
    let price: number | undefined;
    {
        const { FlashSales } = getWorldState(buildLabel);
        const flashSale = FlashSales.find(s => s.TypeName == internalName);
        if (flashSale) {
            if (usePremium && flashSale.PremiumOverride > 0) {
                return flashSale.PremiumOverride * quantity;
            } else if (!usePremium && flashSale.RegularOverride > 0) {
                return flashSale.RegularOverride * quantity;
            }
        }
    }
    const isBooster = storeItemName in ExportBoosters;
    if (isBooster) {
        price = 40 * (durability + 1);
    } else if (isBundle) {
        const bundle = getBundle(storeItemName, buildLabel)!;
        if (usePremium && bundle.platinumCost) {
            price = ExportBundles[storeItemName].platinumCost;
        } else if (!usePremium && bundle.creditsCost) {
            price = ExportBundles[storeItemName].creditsCost;
        } else {
            let sum = 0;
            for (const component of bundle.components) {
                sum += getPrice(
                    component.typeName,
                    component.purchaseQuantity,
                    [3, 7, 30, 90].indexOf(component.durabilityDays ?? 3),
                    usePremium,
                    buildLabel
                );
            }
            const discount = typeof bundle.packageDiscount === "number" ? bundle.packageDiscount : 0.25;
            price = Math.round(sum * (1 - discount));
        }
    } else {
        const boosterPack = getBoosterPack(internalName, buildLabel);
        const isBoosterPack = boosterPack !== undefined;
        if (isBoosterPack) {
            if (usePremium) price = boosterPack.platinumCost;
        } else {
            const categories = [
                ExportBundles,
                ExportCreditBundles,
                ExportCustoms,
                ExportFlavour,
                ExportGear,
                ExportRecipes,
                ExportResources,
                ExportSentinels,
                ExportWarframes,
                ExportWeapons
            ];
            const category = categories.find(c => internalName in c);
            if (category) {
                const item = category[internalName];
                if (usePremium && "platinumCost" in item) {
                    price = item.platinumCost;
                } else if (!usePremium && "creditsCost" in item) {
                    price = item.creditsCost;
                }
            } else {
                const recipe = getRecipe(internalName);
                if (recipe) {
                    if (usePremium && "platinumCost" in recipe) {
                        price = recipe.platinumCost;
                    } else if (!usePremium && "creditsCost" in recipe) {
                        price = recipe.creditsCost;
                    }
                }
            }

            if (usePremium) {
                if (version_compare(buildLabel, gameToBuildVersion["18.16.0"]) < 0) {
                    if (internalName == "/Lotus/Powersuits/Mag/Mag") {
                        price = ExportWarframes["/Lotus/Powersuits/Loki/Loki"].platinumCost;
                    } else if (internalName == "/Lotus/Powersuits/Loki/Loki") {
                        price = ExportWarframes["/Lotus/Powersuits/Mag/Mag"].platinumCost;
                    }
                }
                if (version_compare(buildLabel, gameToBuildVersion["18.0.2"]) < 0) {
                    if (internalName == "/Lotus/Upgrades/Skins/Dragon/DragonAltHelmet") price = 40;
                }
            } else {
                // I'm not sure when they stopped selling it
                if (storeItemName == "/Lotus/StoreItems/Types/Restoratives/Cipher") price = 250;
            }
        }
    }

    if (price == undefined) {
        throw new Error(`no price found for ${storeItemName}`);
    }

    return price * quantity;
};
