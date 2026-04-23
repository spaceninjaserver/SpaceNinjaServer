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
    ExportRegions,
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
import { promises as fs } from "fs";
import path from "path";

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
    fits: { type: string; rarity: TRarity; statAtten?: number }[];
    upgrades: IU5FingerprintUpgrade[];
    numUpgrades: {
        number: number;
        rarity: TRarity;
    }[];
}

export interface IU5FingerprintUpgrade {
    type: string;
    valueRarity: Record<Exclude<TRarity, "LEGENDARY">, [number, number]>;
    rarity: TRarity;
    operation: "MULTIPLY" | "ADD";
    displayAsPercent?: true;
}

const U5WeaponUpgrades: IU5FingerprintUpgrade[] = [
    {
        type: "WEAPON_DAMAGE_AMOUNT",
        valueRarity: {
            COMMON: [1.015, 1.15],
            UNCOMMON: [1.05, 1.25],
            RARE: [1.1, 1.5]
        },
        rarity: "COMMON",
        operation: "MULTIPLY"
    },
    {
        type: "WEAPON_FIRE_DAMAGE",
        valueRarity: {
            COMMON: [0.015, 0.15],
            UNCOMMON: [0.05, 0.25],
            RARE: [0.1, 0.5]
        },
        rarity: "RARE",
        operation: "ADD",
        displayAsPercent: true
    },
    {
        type: "WEAPON_ELECTRICITY_DAMAGE",
        valueRarity: {
            COMMON: [0.015, 0.15],
            UNCOMMON: [0.05, 0.25],
            RARE: [0.1, 0.5]
        },
        rarity: "COMMON",
        operation: "ADD",
        displayAsPercent: true
    },
    {
        type: "WEAPON_FREEZE_DAMAGE",
        valueRarity: {
            COMMON: [0.015, 0.15],
            UNCOMMON: [0.05, 0.25],
            RARE: [0.1, 0.5]
        },
        rarity: "COMMON",
        operation: "ADD",
        displayAsPercent: true
    },
    {
        type: "WEAPON_ARMOR_PIERCING_DAMAGE",
        valueRarity: {
            COMMON: [0.015, 0.15],
            UNCOMMON: [0.05, 0.25],
            RARE: [0.1, 0.5]
        },
        rarity: "COMMON",
        operation: "ADD",
        displayAsPercent: true
    },
    {
        type: "WEAPON_STUN_CHANCE",
        valueRarity: {
            COMMON: [0.025, 0.1],
            UNCOMMON: [0.05, 0.2],
            RARE: [0.1, 0.4]
        },
        rarity: "UNCOMMON",
        operation: "ADD",
        displayAsPercent: true
    },
    {
        type: "WEAPON_CLIP_MAX",
        valueRarity: {
            COMMON: [1.05, 1.35],
            UNCOMMON: [1.1, 1.5],
            RARE: [1.15, 2]
        },
        rarity: "UNCOMMON",
        operation: "MULTIPLY"
    },
    {
        type: "WEAPON_FIRE_ITERATIONS",
        valueRarity: {
            COMMON: [1.25, 1.75],
            UNCOMMON: [1.5, 2],
            RARE: [2, 4]
        },
        rarity: "RARE",
        operation: "MULTIPLY"
    },
    {
        type: "WEAPON_PUNCTURE_DEPTH",
        valueRarity: {
            COMMON: [2, 5],
            UNCOMMON: [2, 10],
            RARE: [3, 15]
        },
        rarity: "RARE",
        operation: "ADD"
    },
    {
        type: "WEAPON_AMMO_MAX",
        valueRarity: {
            COMMON: [1.05, 1.5],
            UNCOMMON: [1.1, 1.75],
            RARE: [1.15, 2]
        },
        rarity: "UNCOMMON",
        operation: "MULTIPLY"
    },
    {
        type: "WEAPON_RELOAD_SPEED",
        valueRarity: {
            COMMON: [1.05, 1.5],
            UNCOMMON: [1.075, 1.75],
            RARE: [1.1, 2]
        },
        rarity: "UNCOMMON",
        operation: "MULTIPLY"
    },
    {
        type: "WEAPON_FIRE_RATE",
        valueRarity: {
            COMMON: [1.01, 1.2],
            UNCOMMON: [1.05, 1.5],
            RARE: [1.1, 1.75]
        },
        rarity: "UNCOMMON",
        operation: "MULTIPLY"
    },
    {
        type: "WEAPON_CRIT_CHANCE",
        valueRarity: {
            COMMON: [0.0099999998, 0.1],
            UNCOMMON: [0.025, 0.15],
            RARE: [0.05, 0.2]
        },
        rarity: "COMMON",
        operation: "ADD",
        displayAsPercent: true
    },
    {
        type: "WEAPON_CRIT_DAMAGE",
        valueRarity: {
            COMMON: [0.1, 0.5],
            UNCOMMON: [0.2, 1],
            RARE: [0.3, 1.5]
        },
        rarity: "COMMON",
        operation: "ADD",
        displayAsPercent: true
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
                type: "/Lotus/Weapons/Tenno/Rifle/Rifle",
                rarity: "COMMON"
            }
        ],
        upgrades: [
            {
                type: "WEAPON_FIRE_DAMAGE",
                valueRarity: {
                    COMMON: [0.025, 0.3],
                    UNCOMMON: [0.05, 0.4],
                    RARE: [0.1, 0.7]
                },
                rarity: "COMMON",
                operation: "ADD",
                displayAsPercent: true
            }
        ],
        numUpgrades: [{ number: 1, rarity: "COMMON" }]
    },
    "/Lotus/Upgrades/Modules/GrineerMeleeModule": {
        fits: [
            {
                type: "/Lotus/Weapons/Tenno/Melee/DualShortSword/DualShortSword",
                rarity: "UNCOMMON"
            },
            {
                type: "/Lotus/Weapons/Tenno/Melee/LongSword/LongSword",
                rarity: "UNCOMMON"
            },
            {
                type: "/Lotus/Weapons/Tenno/Melee/Staff/Staff",
                rarity: "UNCOMMON"
            },
            {
                type: "/Lotus/Types/Game/LotusMeleeWeapon",
                rarity: "COMMON"
            },
            {
                type: "/Lotus/Weapons/Tenno/Melee/Fist/Fist",
                rarity: "UNCOMMON"
            },
            {
                type: "/Lotus/Weapons/Tenno/Melee/Dagger/Dagger",
                rarity: "UNCOMMON"
            }
        ],
        upgrades: [
            {
                type: "WEAPON_MELEE_DAMAGE",
                valueRarity: {
                    COMMON: [1.05, 1.15],
                    UNCOMMON: [1.075, 1.25],
                    RARE: [1.15, 1.5]
                },
                rarity: "COMMON",
                operation: "MULTIPLY"
            },
            {
                type: "WEAPON_FIRE_DAMAGE",
                valueRarity: {
                    COMMON: [0.05, 0.15],
                    UNCOMMON: [0.075, 0.25],
                    RARE: [0.1, 0.5]
                },
                rarity: "RARE",
                operation: "ADD",
                displayAsPercent: true
            },
            {
                type: "WEAPON_ELECTRICITY_DAMAGE",
                valueRarity: {
                    COMMON: [0.05, 0.15],
                    UNCOMMON: [0.075, 0.25],
                    RARE: [0.1, 0.5]
                },
                rarity: "COMMON",
                operation: "ADD",
                displayAsPercent: true
            },
            {
                type: "WEAPON_FREEZE_DAMAGE",
                valueRarity: {
                    COMMON: [0.05, 0.15],
                    UNCOMMON: [0.075, 0.25],
                    RARE: [0.1, 0.5]
                },
                rarity: "COMMON",
                operation: "ADD",
                displayAsPercent: true
            },
            {
                type: "WEAPON_ARMOR_PIERCING_DAMAGE",
                valueRarity: {
                    COMMON: [0.05, 0.15],
                    UNCOMMON: [0.075, 0.25],
                    RARE: [0.1, 0.5]
                },
                rarity: "COMMON",
                operation: "ADD",
                displayAsPercent: true
            },
            {
                type: "WEAPON_STUN_CHANCE",
                valueRarity: {
                    COMMON: [0.05, 0.1],
                    UNCOMMON: [0.1, 0.2],
                    RARE: [0.2, 0.4]
                },
                rarity: "UNCOMMON",
                operation: "ADD",
                displayAsPercent: true
            },
            {
                type: "WEAPON_CRIT_CHANCE",
                valueRarity: {
                    COMMON: [0.01, 0.1],
                    UNCOMMON: [0.02, 0.15],
                    RARE: [0.05, 0.25]
                },
                rarity: "COMMON",
                operation: "ADD",
                displayAsPercent: true
            },
            {
                type: "WEAPON_CRIT_DAMAGE",
                valueRarity: {
                    COMMON: [0.05, 1],
                    UNCOMMON: [0.1, 1.5],
                    RARE: [0.2, 2]
                },
                rarity: "COMMON",
                operation: "ADD",
                displayAsPercent: true
            },
            {
                type: "WEAPON_MELEE_HEAVY_DAMAGE",
                valueRarity: {
                    COMMON: [1.025, 1.25],
                    UNCOMMON: [1.05, 1.5],
                    RARE: [1.15, 1.75]
                },
                rarity: "UNCOMMON",
                operation: "MULTIPLY"
            },
            {
                type: "WEAPON_MELEE_CHARGE_RATE",
                valueRarity: {
                    COMMON: [0.025, 0.3],
                    UNCOMMON: [0.05, 0.4],
                    RARE: [0.1, 0.5]
                },
                rarity: "UNCOMMON",
                operation: "ADD",
                displayAsPercent: true
            },
            {
                type: "WEAPON_FIRE_RATE",
                valueRarity: {
                    COMMON: [1.05, 1.15],
                    UNCOMMON: [1.075, 1.35],
                    RARE: [1.1, 1.5]
                },
                rarity: "UNCOMMON",
                operation: "MULTIPLY"
            }
        ],
        numUpgrades: [
            { number: 1, rarity: "COMMON" },
            { number: 1, rarity: "RARE" }
        ]
    },
    "/Lotus/Upgrades/Modules/GrineerPistolModule": {
        fits: [
            {
                type: "/Lotus/Weapons/Tenno/Pistol/LotusPistol",
                rarity: "COMMON"
            },
            {
                type: "/Lotus/Weapons/Tenno/Pistol/AutoPistol",
                rarity: "RARE"
            },
            {
                type: "/Lotus/Weapons/Tenno/Pistol/BurstPistol",
                rarity: "UNCOMMON"
            },
            {
                type: "/Lotus/Weapons/Tenno/Pistol/CrossBow",
                rarity: "UNCOMMON"
            },
            {
                type: "/Lotus/Weapons/Tenno/Pistol/HandShotGun",
                rarity: "UNCOMMON"
            },
            {
                type: "/Lotus/Weapons/Tenno/Pistol/Pistol",
                rarity: "UNCOMMON"
            }
        ],
        upgrades: U5WeaponUpgrades,
        numUpgrades: [
            { number: 1, rarity: "COMMON" },
            { number: 1, rarity: "RARE" }
        ]
    },
    "/Lotus/Upgrades/Modules/GrineerRifleModule": {
        fits: [
            {
                type: "/Lotus/Weapons/Tenno/Rifle/LotusRifle",
                rarity: "COMMON"
            },
            {
                type: "/Lotus/Weapons/Tenno/Rifle/BurstRifle",
                rarity: "UNCOMMON",
                statAtten: 1.2
            },
            {
                type: "/Lotus/Weapons/Tenno/Rifle/SniperRifle",
                rarity: "RARE",
                statAtten: 1.1
            },
            {
                type: "/Lotus/Weapons/Tenno/Rifle/HeavyRifle",
                rarity: "RARE",
                statAtten: 1.3
            },
            {
                type: "/Lotus/Weapons/Tenno/Rifle/Rifle",
                rarity: "UNCOMMON",
                statAtten: 1.2
            },
            {
                type: "/Lotus/Weapons/Tenno/Rifle/SemiAutoRifle",
                rarity: "UNCOMMON",
                statAtten: 1.1
            }
        ],
        upgrades: U5WeaponUpgrades,
        numUpgrades: [
            { number: 1, rarity: "COMMON" },
            { number: 1, rarity: "RARE" }
        ]
    },
    "/Lotus/Upgrades/Modules/GrineerShotgunModule": {
        fits: [
            {
                type: "/Lotus/Weapons/Tenno/Shotgun/LotusShotgun",
                rarity: "COMMON",
                statAtten: 1
            },
            {
                type: "/Lotus/Weapons/Tenno/Shotgun/Shotgun",
                rarity: "UNCOMMON",
                statAtten: 1.2
            },
            {
                type: "/Lotus/Weapons/Tenno/Shotgun/FullAutoShotgun",
                rarity: "RARE",
                statAtten: 1.1
            }
        ],
        upgrades: U5WeaponUpgrades,
        numUpgrades: [
            { number: 1, rarity: "COMMON" },
            { number: 1, rarity: "RARE" }
        ]
    },
    "/Lotus/Upgrades/Modules/OrokinWarframeModule": {
        fits: [
            {
                type: "/Lotus/Types/Game/PowerSuit",
                rarity: "COMMON"
            },
            {
                type: "/Lotus/Powersuits/Ember/Ember",
                rarity: "UNCOMMON",
                statAtten: 1.2
            },
            {
                type: "/Lotus/Powersuits/Excalibur/Excalibur",
                rarity: "UNCOMMON",
                statAtten: 1.1
            },
            {
                type: "/Lotus/Powersuits/Loki/Loki",
                rarity: "UNCOMMON",
                statAtten: 1.1
            },
            {
                type: "/Lotus/Powersuits/Mag/Mag",
                rarity: "UNCOMMON",
                statAtten: 1.1
            },
            {
                type: "/Lotus/Powersuits/Ninja/Ninja",
                rarity: "UNCOMMON",
                statAtten: 1.1
            },
            {
                type: "/Lotus/Powersuits/Rhino/Rhino",
                rarity: "UNCOMMON",
                statAtten: 1.1
            },
            {
                type: "/Lotus/Powersuits/Trinity/Trinity",
                rarity: "UNCOMMON",
                statAtten: 1.1
            },
            {
                type: "/Lotus/Powersuits/Volt/Volt",
                rarity: "UNCOMMON",
                statAtten: 1.1
            }
        ],
        upgrades: [
            {
                type: "AVATAR_SHIELD_MAX",
                valueRarity: {
                    COMMON: [1.05, 1.4],
                    UNCOMMON: [1.1, 1.7],
                    RARE: [1.2, 2]
                },
                rarity: "COMMON",
                operation: "MULTIPLY"
            },
            {
                type: "AVATAR_ARMOUR",
                valueRarity: {
                    COMMON: [1.05, 1.4],
                    UNCOMMON: [1.1, 1.7],
                    RARE: [1.2, 2]
                },
                rarity: "COMMON",
                operation: "MULTIPLY"
            },
            {
                type: "AVATAR_HEALTH_MAX",
                valueRarity: {
                    COMMON: [1.1, 1.4],
                    UNCOMMON: [1.15, 1.8],
                    RARE: [1.2, 2]
                },
                rarity: "UNCOMMON",
                operation: "MULTIPLY"
            },
            {
                type: "AVATAR_POWER_MAX",
                valueRarity: {
                    COMMON: [1.05, 1.4],
                    UNCOMMON: [1.1, 1.75],
                    RARE: [1.15, 2]
                },
                rarity: "RARE",
                operation: "MULTIPLY"
            },
            {
                type: "AVATAR_SHIELD_RECHARGE_RATE",
                valueRarity: {
                    COMMON: [1.05, 1.4],
                    UNCOMMON: [1.1, 1.75],
                    RARE: [1.15, 2]
                },
                rarity: "UNCOMMON",
                operation: "MULTIPLY"
            },
            {
                type: "WEAPON_MELEE_DAMAGE",
                valueRarity: {
                    COMMON: [1.05, 1.4],
                    UNCOMMON: [1.1, 1.75],
                    RARE: [1.15, 2]
                },
                rarity: "UNCOMMON",
                operation: "MULTIPLY"
            },
            {
                type: "AVATAR_SPRINT_SPEED",
                valueRarity: {
                    COMMON: [1.03, 1.1],
                    UNCOMMON: [1.05, 1.25],
                    RARE: [1.1, 1.35]
                },
                rarity: "UNCOMMON",
                operation: "MULTIPLY"
            },
            {
                type: "AVATAR_ENEMY_RADAR",
                valueRarity: {
                    COMMON: [15, 20],
                    UNCOMMON: [20, 40],
                    RARE: [25, 60]
                },
                rarity: "RARE",
                operation: "ADD"
            },
            {
                type: "AVATAR_LOOT_RADAR",
                valueRarity: {
                    COMMON: [15, 20],
                    UNCOMMON: [20, 40],
                    RARE: [25, 60]
                },
                rarity: "UNCOMMON",
                operation: "ADD"
            },
            {
                type: "AVATAR_ABILITY_RANGE",
                valueRarity: {
                    COMMON: [1.05, 1.4],
                    UNCOMMON: [1.1, 1.5],
                    RARE: [1.15, 1.8]
                },
                rarity: "UNCOMMON",
                operation: "MULTIPLY"
            },
            {
                type: "AVATAR_ABILITY_DURATION",
                valueRarity: {
                    COMMON: [1.02, 1.3],
                    UNCOMMON: [1.05, 1.4],
                    RARE: [1.05, 1.5]
                },
                rarity: "RARE",
                operation: "MULTIPLY"
            },
            {
                type: "AVATAR_ABILITY_EFFICIENCY",
                valueRarity: {
                    COMMON: [1.03, 1.3],
                    UNCOMMON: [1.05, 1.5],
                    RARE: [1.1, 1.7]
                },
                rarity: "RARE",
                operation: "MULTIPLY"
            },
            {
                type: "AVATAR_ABILITY_STRENGTH",
                valueRarity: {
                    COMMON: [1.03, 1.4],
                    UNCOMMON: [1.05, 1.5],
                    RARE: [1.1, 1.7]
                },
                rarity: "RARE",
                operation: "MULTIPLY"
            }
        ],
        numUpgrades: [
            { number: 1, rarity: "COMMON" },
            { number: 1, rarity: "RARE" }
        ]
    },
    "/Lotus/Upgrades/Modules/TennoSwordModule": {
        fits: [
            {
                type: "/Lotus/Weapons/Tenno/Melee/DualShortSword/DualShortSword",
                rarity: "UNCOMMON"
            },
            {
                type: "/Lotus/Weapons/Tenno/Melee/LongSword/LongSword",
                rarity: "UNCOMMON"
            },
            {
                type: "/Lotus/Weapons/Tenno/Melee/Staff/Staff",
                rarity: "UNCOMMON"
            },
            {
                type: "/Lotus/Types/Game/LotusMeleeWeapon",
                rarity: "COMMON"
            }
        ],
        upgrades: [
            {
                type: "WEAPON_MELEE_DAMAGE",
                operation: "MULTIPLY",
                valueRarity: {
                    COMMON: [1.05, 1.15],
                    UNCOMMON: [1.075, 1.25],
                    RARE: [1.15, 1.5]
                },
                rarity: "COMMON"
            },
            {
                type: "WEAPON_FIRE_DAMAGE",
                operation: "ADD",
                valueRarity: {
                    COMMON: [0.05, 0.15],
                    UNCOMMON: [0.075, 0.25],
                    RARE: [0.1, 0.5]
                },
                rarity: "RARE",
                displayAsPercent: true
            },
            {
                type: "WEAPON_ELECTRICITY_DAMAGE",
                operation: "ADD",
                valueRarity: {
                    COMMON: [0.05, 0.15],
                    UNCOMMON: [0.075, 0.25],
                    RARE: [0.1, 0.5]
                },
                rarity: "COMMON",
                displayAsPercent: true
            },
            {
                type: "WEAPON_FREEZE_DAMAGE",
                operation: "ADD",
                valueRarity: {
                    COMMON: [0.05, 0.15],
                    UNCOMMON: [0.075, 0.25],
                    RARE: [0.1, 0.5]
                },
                rarity: "COMMON",
                displayAsPercent: true
            },
            {
                type: "WEAPON_ARMOR_PIERCING_DAMAGE",
                operation: "ADD",
                valueRarity: {
                    COMMON: [0.05, 0.15],
                    UNCOMMON: [0.075, 0.25],
                    RARE: [0.1, 0.5]
                },
                rarity: "COMMON",
                displayAsPercent: true
            },
            {
                type: "WEAPON_STUN_CHANCE",
                operation: "ADD",
                valueRarity: {
                    COMMON: [0.05, 0.1],
                    UNCOMMON: [0.1, 0.2],
                    RARE: [0.2, 0.4]
                },
                rarity: "UNCOMMON",
                displayAsPercent: true
            },
            {
                type: "WEAPON_CRIT_CHANCE",
                operation: "ADD",
                valueRarity: {
                    COMMON: [0.01, 0.1],
                    UNCOMMON: [0.02, 0.15],
                    RARE: [0.05, 0.25]
                },
                rarity: "COMMON",
                displayAsPercent: true
            },
            {
                type: "WEAPON_CRIT_DAMAGE",
                operation: "ADD",
                valueRarity: {
                    COMMON: [0.05, 1],
                    UNCOMMON: [0.1, 1.5],
                    RARE: [0.2, 2]
                },
                rarity: "COMMON",
                displayAsPercent: true
            },
            {
                type: "WEAPON_MELEE_HEAVY_DAMAGE",
                operation: "MULTIPLY",
                valueRarity: {
                    COMMON: [1.025, 1.25],
                    UNCOMMON: [1.05, 1.5],
                    RARE: [1.15, 1.75]
                },
                rarity: "UNCOMMON"
            },
            {
                type: "WEAPON_MELEE_CHARGE_RATE",
                operation: "ADD",
                valueRarity: {
                    COMMON: [0.025, 0.3],
                    UNCOMMON: [0.05, 0.4],
                    RARE: [0.1, 0.5]
                },
                rarity: "UNCOMMON",
                displayAsPercent: true
            },
            {
                type: "WEAPON_FIRE_RATE",
                operation: "MULTIPLY",
                valueRarity: {
                    COMMON: [1.05, 1.15],
                    UNCOMMON: [1.075, 1.35],
                    RARE: [1.1, 1.5]
                },
                rarity: "UNCOMMON"
            }
        ],
        numUpgrades: [
            { number: 1, rarity: "COMMON" },
            { number: 1, rarity: "RARE" }
        ]
    }
};

const legacyBoosterPacksCache = new Map<string, Partial<IBoosterPack>>();
const legacySolarMapCache = new Map<string, Record<string, IRegion>>();

const getLegacyDataIndex = async (target: string): Promise<string[]> => {
    const filePath = path.join("./static/fixed_responses/data", target, "index.json");
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as Promise<string[]>;
};

const getLegacyDataVersion = async (target: string, buildLabel: string): Promise<string | null> => {
    const index = await getLegacyDataIndex(target);
    let selected: string | null = null;
    for (const v of index) {
        if (version_compare(v, buildLabel) <= 0) {
            selected = v;
        } else {
            break;
        }
    }
    return selected;
};

const getLegacyBoosterPackData = async (target: string, buildLabel: string): Promise<Partial<IBoosterPack>> => {
    const key = `${target}:${buildLabel}`;
    const cached = legacyBoosterPacksCache.get(key);
    if (cached) return cached;

    const filePath = path.join("./static/fixed_responses/data", target, `${buildLabel}.json`);
    const raw = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(raw) as Partial<IBoosterPack>;
    legacyBoosterPacksCache.set(key, json);

    return json;
};

const getLegacySolarMapData = async (target: string, buildLabel: string): Promise<Record<string, IRegion>> => {
    const key = `${target}:${buildLabel}`;
    const cached = legacySolarMapCache.get(key);
    if (cached) return cached;

    const filePath = path.join("./static/fixed_responses/data", target, `${buildLabel}.json`);
    const raw = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(raw) as Record<string, IRegion>;
    legacySolarMapCache.set(key, json);

    return json;
};

export const getRecipe = (uniqueName: string): IRecipe | undefined => {
    return ExportRecipes[uniqueName] ?? supplementalRecipes[uniqueName];
};

export const getSyndicate = (tag: string, buildLabel: string | undefined): ISyndicate | undefined => {
    if (buildLabel && version_compare(buildLabel, gameToBuildVersion["41.0.0"]) < 0) {
        if (tag == "EntratiSyndicate") {
            return EntratiSyndicate_pre_U41 as ISyndicate;
        }
        if (version_compare(buildLabel, gameToBuildVersion["33.5.0"]) < 0) {
            let syndicate = ExportSyndicates[tag];
            if (tag == "ArbitersSyndicate") {
                syndicate = {
                    ...syndicate,
                    initiationReward: "/Lotus/StoreItems/Upgrades/Skins/Sigils/SyndicateSigilArbitersOfHexisA"
                };
            } else if (tag == "CephalonSudaSyndicate") {
                syndicate = {
                    ...syndicate,
                    initiationReward: "/Lotus/StoreItems/Upgrades/Skins/Sigils/SyndicateSigilCephalonSudaA"
                };
            } else if (tag == "NewLokaSyndicate") {
                syndicate = {
                    ...syndicate,
                    initiationReward: "/Lotus/StoreItems/Upgrades/Skins/Sigils/SyndicateSigilNewLokaA"
                };
            } else if (tag == "PerrinSyndicate") {
                syndicate = {
                    ...syndicate,
                    initiationReward: "/Lotus/StoreItems/Upgrades/Skins/Sigils/SyndicateSigilPerrinSequenceA"
                };
            } else if (tag == "RedVeilSyndicate") {
                syndicate = {
                    ...syndicate,
                    initiationReward: "/Lotus/StoreItems/Upgrades/Skins/Sigils/SyndicateSigilRedVeilA"
                };
            } else if (tag == "SteelMeridianSyndicate") {
                syndicate = {
                    ...syndicate,
                    initiationReward: "/Lotus/StoreItems/Upgrades/Skins/Sigils/SyndicateSigilSteelMeridianA"
                };
            }
            return syndicate;
        }
    }
    return ExportSyndicates[tag];
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
    const key = getKey(levelKey, buildLabel);

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

export const getKeyChainMessage = (
    { KeyChain, ChainStage }: IKeyChainRequest,
    buildLabel: string | undefined
): IMessage => {
    const chainStages = getKey(KeyChain, buildLabel)?.chainStages;
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

export const getBoosterPack = async (
    uniqueName: string,
    buildLabel: string = ""
): Promise<IBoosterPack | undefined> => {
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
                { COMMON: 1, UNCOMMON: 0.05, RARE: 0.01, LEGENDARY: 0 },
                { COMMON: 1, UNCOMMON: 0.25, RARE: 0.05, LEGENDARY: 0 },
                { COMMON: 1, UNCOMMON: 0.25, RARE: 0.05, LEGENDARY: 0 },
                { COMMON: 1, UNCOMMON: 0.25, RARE: 0.05, LEGENDARY: 0 },
                { COMMON: 1, UNCOMMON: 0.25, RARE: 0.1, LEGENDARY: 0 }
            ],
            canGiveDuplicates: true,
            platinumCost: 75
        };
        if (buildLabel) {
            if (version_compare(buildLabel, "2013.06.07.23.44") >= 0) {
                boosterPack.rarityWeightsPerRoll[4] = { COMMON: 0, UNCOMMON: 0, RARE: 1, LEGENDARY: 0 };
            }
            if (version_compare(buildLabel, gameToBuildVersion["9.1.0"]) >= 0) {
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
    if (
        [
            "/Lotus/Types/BoosterPacks/RandomProjection",
            "/Lotus/Types/BoosterPacks/LoginRewardRandomProjection",
            "/Lotus/Types/BoosterPacks/RandomSyndicateProjectionPack",
            "/Lotus/Types/BoosterPacks/GreaterRandomProjection"
        ].includes(uniqueName)
    ) {
        // PE+ already have latest data - so there is no need to do anything
        if (buildLabel && version_compare(buildLabel, gameToBuildVersion["42.0.6"]) < 0) {
            const target = "RandomProjection";
            const version = await getLegacyDataVersion(target, buildLabel);
            if (version) {
                const legacyData = await getLegacyBoosterPackData(target, version);
                return {
                    ...ExportBoosterPacks[uniqueName],
                    ...legacyData
                };
            }
        }
    }
    if (
        [
            "/Lotus/Types/BoosterPacks/CommonArtifactPack", // 30p
            "/Lotus/Types/BoosterPacks/UncommonArtifactPack", // 45p
            "/Lotus/Types/BoosterPacks/RareArtifactPack", // 60p
            "/Lotus/Types/BoosterPacks/PremiumUncommonArtifactPack", // 75p
            "/Lotus/Types/BoosterPacks/PremiumRareArtifactPack" // 90p
        ].includes(uniqueName)
    ) {
        // Mod packs retired in U25
        if (buildLabel && version_compare(buildLabel, gameToBuildVersion["25.0.0"]) < 0) {
            const target = "LotusArtifactUpgradePackBase";
            const version = await getLegacyDataVersion(target, buildLabel);
            if (version) {
                const legacyData = await getLegacyBoosterPackData(target, version);
                return {
                    ...ExportBoosterPacks[uniqueName],
                    ...legacyData
                };
            }
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
            const latestData = ExportKeys[uniqueName];
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
    } else if (uniqueName == "/Lotus/Types/Keys/InfestedIntroQuest/InfestedIntroQuestKeyChain") {
        if (buildLabel && version_compare(buildLabel, gameToBuildVersion["37.0.0"]) < 0) {
            const latestData = ExportKeys[uniqueName];
            return {
                ...latestData,
                chainStages: [
                    latestData.chainStages![0],
                    latestData.chainStages![1],
                    latestData.chainStages![2],
                    latestData.chainStages![3],
                    latestData.chainStages![4],
                    {
                        itemsToGiveWhenTriggered: [],
                        messageToSendWhenTriggered: {
                            sender: "/Lotus/Language/Menu/Mailbox_WarframeSender",
                            title: "/Lotus/Language/G1Quests/IIQCompleteMessageTitle",
                            body: "/Lotus/Language/G1Quests/IIQCompleteMessageBody",
                            attachments: [],
                            countedAttachments: []
                        }
                    },
                    latestData.chainStages![5]
                ]
            };
        }
    }

    return ExportKeys[uniqueName];
};

export const getMissionDeck = (uniqueName: string): TMissionDeck | undefined => {
    return ExportRewards[uniqueName];
};

const u7WeaponCosts: Record<string, number> = {
    "/Lotus/Weapons/Tenno/Pistol/HeavyPistol": 35_000,
    "/Lotus/Weapons/Tenno/Akimbo/AkimboPistol": 12_000,
    "/Lotus/Weapons/Tenno/Pistol/AutoPistol": 15_000,
    "/Lotus/Weapons/Tenno/Pistol/HandShotGun": 35_000,
    "/Lotus/Weapons/Tenno/Pistol/Pistol": 4_000,
    "/Lotus/Weapons/Tenno/Pistol/BurstPistol": 12_000,
    "/Lotus/Weapons/Tenno/Rifle/BurstRifle": 12_000,
    "/Lotus/Weapons/Tenno/Rifle/StartingRifle": 8_000,
    "/Lotus/Weapons/Tenno/Rifle/HeavyRifle": 50_000,
    "/Lotus/Weapons/Tenno/Rifle/SemiAutoRifle": 50_000,
    "/Lotus/Weapons/Tenno/Shotgun/FullAutoShotgun": 50_000,
    "/Lotus/Weapons/Tenno/Rifle/SniperRifle": 50_000,
    "/Lotus/Weapons/Tenno/Rifle/Rifle": 10_000,
    "/Lotus/Weapons/Tenno/Shotgun/Shotgun": 17_500,
    "/Lotus/Weapons/Tenno/Melee/LongSword/LongSword": 15_000,
    "/Lotus/Weapons/Tenno/Melee/Fist/Fist": 30_000,
    "/Lotus/Weapons/Tenno/Melee/DualShortSword/DualShortSword": 45_000,
    "/Lotus/Weapons/Tenno/Melee/Staff/Staff": 15_000
};

export const getPrice = (
    storeItemName: string,
    quantity: number = 1,
    durability: number = 0,
    usePremium: boolean,
    buildLabel: string
): number => {
    const isBundle = storeItemName in ExportBundles;
    let internalName = isBundle ? storeItemName : fromStoreItem(storeItemName);

    {
        const { FlashSales } = getWorldState(buildLabel);
        const flashSale = FlashSales.find(s => s.TypeName == internalName);
        if (flashSale) {
            if (usePremium && flashSale.PremiumOverride) {
                return flashSale.PremiumOverride * quantity;
            } else if (!usePremium && flashSale.RegularOverride) {
                return flashSale.RegularOverride * quantity;
            }
        }
    }

    if (storeItemName in ExportBoosters) {
        return 40 * (durability + 1);
    }

    if (!usePremium && version_compare(buildLabel, gameToBuildVersion["8.0.0"]) < 0 && internalName in u7WeaponCosts) {
        return u7WeaponCosts[internalName];
    }

    let price: number | undefined;
    if (isBundle) {
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
    } else if (internalName in ExportBoosterPacks) {
        if (usePremium) price = ExportBoosterPacks[internalName].platinumCost;
    } else {
        // https://onlyg.it/OpenWF/SpaceNinjaServer/issues/3941
        if (internalName.endsWith("LeftArmor")) {
            internalName = internalName.substring(0, internalName.length - "LeftArmor".length) + "Armor";
        }

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

    if (price == undefined) {
        throw new Error(`no price found for ${storeItemName}`);
    }

    return price * quantity;
};

export const getRegion = async (uniqueName: string, buildLabel: string | undefined): Promise<IRegion | undefined> => {
    // after U27.2.0 OriginSolarMapRedux moved to binary format, so we don't have data for it
    if (buildLabel && version_compare(buildLabel, gameToBuildVersion["27.2.0"]) <= 0) {
        const target = version_compare(buildLabel, "2016.07.08.16.56") < 0 ? "OriginSolarMap" : "OriginSolarMapRedux";
        const version = await getLegacyDataVersion(target, buildLabel);
        if (version) {
            const legacyData = await getLegacySolarMapData(target, version);
            return legacyData[uniqueName];
        }
    }
    return ExportRegions[uniqueName];
};

// For prex cards
export const getShipDecoByNameTag = (name: string): string => {
    for (const [uniqueName, data] of Object.entries(ExportResources)) {
        if (data.productCategory == "ShipDecorations" && data.name == name) {
            return uniqueName;
        }
    }
    throw new Error(`No ship deco with name tag ${name}`);
};
