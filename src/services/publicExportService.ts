import type {
    IAbility,
    IAvionicsFocus,
    ICustom,
    IDrone,
    IExportCustoms,
    IExportDrones,
    IExportFlavour,
    IExportFusionBundles,
    IExportGear,
    IExportKeys,
    IExportManifest,
    IExportNightwave,
    IExportRecipes,
    IExportRegions,
    IExportRelicArcane,
    IExportResources,
    IExportSentinels,
    IExportSortieRewards,
    IExportUpgrades,
    IExportWarframes,
    IExportWeapons,
    IFlavour,
    IFusionBundle,
    IGear,
    IIconMapping,
    IIntrinsic,
    IKey,
    IModSet,
    INightwaveChallenge,
    IRailjackWeapon,
    IRecipe,
    IRegion,
    IRelicArcane,
    IResource,
    ISentinel,
    ISortieReward,
    IUpgrade,
    IWarframe,
    IWeapon
} from "../types/publicExportTypes.ts";
import {
    ExportAbilities,
    ExportArcanes,
    ExportAvionics,
    ExportCustoms,
    ExportDrones,
    ExportFactions,
    ExportFlavour,
    ExportFocusUpgrades,
    ExportFusionBundles,
    ExportGear,
    ExportIntrinsics,
    ExportKeys,
    ExportMissionTypes,
    ExportModSet,
    ExportNightwave,
    ExportRailjackWeapons,
    ExportRecipes,
    ExportRegions,
    ExportRelics,
    ExportResources,
    ExportRewards,
    ExportSentinels,
    ExportUpgrades,
    ExportWarframes,
    ExportWeapons
} from "warframe-public-export-plus";
import { getDict, getProductCategory, getString } from "./itemDataService.ts";

export const getExportCustoms = (lang: string): IExportCustoms => {
    const dict = getDict(lang);
    const res: ICustom[] = [];
    for (const [uniqueName, data] of Object.entries(ExportCustoms)) {
        res.push({
            uniqueName,
            ...data,
            name: getString(data.name, dict),
            description: data.description ? getString(data.description, dict) : undefined
        });
    }
    return { ExportCustoms: res };
};

export const getExportDrones = (lang: string): IExportDrones => {
    const dict = getDict(lang);
    const res: IDrone[] = [];
    for (const [uniqueName, data] of Object.entries(ExportDrones)) {
        res.push({
            uniqueName,
            ...data,
            name: getString(data.name, dict),
            description: getString(data.description, dict),
            specialities: []
        });
    }
    return { ExportDrones: res };
};

export const getExportFlavour = (lang: string): IExportFlavour => {
    const dict = getDict(lang);
    const res: IFlavour[] = [];
    for (const [uniqueName, data] of Object.entries(ExportFlavour)) {
        res.push({
            uniqueName,
            ...data,
            name: getString(data.name, dict),
            description: getString(data.description, dict),
            codexSecret: !!data.codexSecret
        });
    }
    return { ExportFlavour: res };
};

export const getExportFusionBundles = (lang: string): IExportFusionBundles => {
    const dict = getDict(lang);
    const res: IFusionBundle[] = [];
    for (const [uniqueName, data] of Object.entries(ExportFusionBundles)) {
        res.push({
            uniqueName,
            ...data,
            description: getString(data.description, dict)
        });
    }
    return { ExportFusionBundles: res };
};

export const getExportKeys = (lang: string): IExportKeys => {
    const dict = getDict(lang);
    const res: IKey[] = [];
    for (const [uniqueName, data] of Object.entries(ExportKeys)) {
        if (data.name && data.description) {
            res.push({
                uniqueName,
                ...data,
                name: getString(data.name, dict),
                description: getString(data.description, dict)
            });
        }
    }
    return { ExportKeys: res };
};

export const getExportGear = (lang: string): IExportGear => {
    const dict = getDict(lang);
    const res: IGear[] = [];
    for (const [uniqueName, data] of Object.entries(ExportGear)) {
        res.push({
            uniqueName,
            ...data,
            name: getString(data.name, dict),
            description: getString(data.description, dict)
        });
    }
    return { ExportGear: res };
};

export const getExportRecipes = (): IExportRecipes => {
    const res: IRecipe[] = [];
    for (const [uniqueName, data] of Object.entries(ExportRecipes)) {
        res.push({
            uniqueName,
            ...data,
            ingredients: data.ingredients.map(x => ({
                ...x,
                ProductCategory: getProductCategory(x.ItemType)
            })),
            secretIngredients: data.secretIngredients ?? []
        });
    }
    return { ExportRecipes: res };
};

export const getExportRegions = (lang: string): IExportRegions => {
    const dict = getDict(lang);
    const res: IRegion[] = [];
    for (const [uniqueName, data] of Object.entries(ExportRegions)) {
        if (data.faction) {
            res.push({
                uniqueName,
                name: getString(data.name, dict),
                systemIndex: data.systemIndex,
                systemName: getString(data.systemName, dict),
                nodeType: data.nodeType,
                masteryReq: data.masteryReq,
                missionIndex: ExportMissionTypes[data.missionType].index,
                factionIndex: ExportFactions[data.faction].index,
                minEnemyLevel: data.minEnemyLevel,
                maxEnemyLevel: data.maxEnemyLevel
            });
        }
    }
    return { ExportRegions: res };
};

export const getExportRelicArcane = (lang: string): IExportRelicArcane => {
    const dict = getDict(lang);
    const voidProjectionName = getString("/Lotus/Language/Relics/VoidProjectionName", dict);
    const res: IRelicArcane[] = [];
    for (const [uniqueName, data] of Object.entries(ExportRelics)) {
        res.push({
            uniqueName,
            name: voidProjectionName.replace("|ERA|", data.era).replace("|CATEGORY|", data.category),
            codexSecret: data.codexSecret,
            description: getString(data.description, dict),
            relicRewards: ExportRewards[data.rewardManifest][0].map(x => ({
                rewardName: x.type,
                rarity: x.rarity!,
                tier: 0,
                itemCount: x.itemCount
            }))
        });
    }
    for (const [uniqueName, data] of Object.entries(ExportArcanes)) {
        res.push({
            uniqueName,
            name: getString(data.name, dict),
            codexSecret: data.codexSecret,
            rarity: data.rarity,
            levelStats: [] // TODO
        });
    }
    return { ExportRelicArcane: res };
};

export const getExportResources = (lang: string): IExportResources => {
    const dict = getDict(lang);
    const res: IResource[] = [];
    for (const [uniqueName, data] of Object.entries(ExportResources)) {
        res.push({
            uniqueName,
            ...data,
            name: getString(data.name, dict),
            description: getString(data.description, dict)
        });
    }
    return { ExportResources: res };
};

export const getExportSentinels = (lang: string): IExportSentinels => {
    const dict = getDict(lang);
    const res: ISentinel[] = [];
    for (const [uniqueName, data] of Object.entries(ExportSentinels)) {
        if (
            data.health !== undefined &&
            data.shield !== undefined &&
            data.armor !== undefined &&
            data.stamina !== undefined &&
            data.power !== undefined
        ) {
            res.push({
                uniqueName,
                name: getString(data.name, dict),
                health: data.health,
                shield: data.shield,
                armor: data.armor,
                stamina: data.stamina,
                power: data.power,
                codexSecret: data.codexSecret,
                excludeFromCodex: data.excludeFromCodex,
                description: getString(data.description, dict),
                productCategory: data.productCategory
            });
        }
    }
    return { ExportSentinels: res };
};

const getSortieRewards = (): ISortieReward[] => {
    return ExportRewards["/Lotus/Types/Game/MissionDecks/SortieRewards"][0].map(x => ({
        rewardName: x.type,
        rarity: "COMMON",
        tier: 0,
        itemCount: x.itemCount,
        probability: x.probability!
    }));
};

const getExportNightwave = (dict: Record<string, string>): IExportNightwave => {
    const challenges: INightwaveChallenge[] = [];
    for (const [uniqueName, data] of Object.entries(ExportNightwave.challenges)) {
        challenges.push({
            uniqueName,
            ...data,
            name: getString(data.name, dict),
            description: getString(data.description, dict)
        });
    }
    return {
        affiliationTag: ExportNightwave.affiliationTag,
        challenges: challenges,
        rewards: ExportNightwave.rewards.map(data => ({
            ...data,
            name: getString(data.name ?? "", dict),
            description: getString(data.description ?? "", dict)
        }))
    };
};

const getIntrinsics = (dict: Record<string, string>): IIntrinsic[] => {
    const res: IIntrinsic[] = [];
    for (const [key, data] of Object.entries(ExportIntrinsics)) {
        res.push({
            name: key.substring(4),
            ranks: data.ranks.map(x => ({
                name: getString(x.name, dict),
                description: getString(x.description, dict)
            }))
        });
    }
    return res;
};

export const getExportSortieRewards = (lang: string): IExportSortieRewards => {
    const dict = getDict(lang);
    return {
        ExportSortieRewards: getSortieRewards(),
        ExportNightwave: getExportNightwave(dict),
        ExportRailjack: {
            nodes: [
                {
                    uniqueName: "CrewBattleNode553",
                    name: "Flexa"
                },
                {
                    uniqueName: "CrewBattleNode554",
                    name: "H-2 Cloud"
                },
                {
                    uniqueName: "CrewBattleNode555",
                    name: "R-9 Cloud"
                },
                {
                    uniqueName: "CrewBattleNode550",
                    name: "Nsu Grid"
                },
                {
                    uniqueName: "CrewBattleNode538",
                    name: "Calabash"
                },
                {
                    uniqueName: "CrewBattleNode539",
                    name: "Numina"
                },
                {
                    uniqueName: "CrewBattleNode540",
                    name: "Arc Silver"
                },
                {
                    uniqueName: "CrewBattleNode541",
                    name: "Erato"
                },
                {
                    uniqueName: "CrewBattleNode542",
                    name: "Lu-yan"
                },
                {
                    uniqueName: "CrewBattleNode543",
                    name: "Sabmir Cloud"
                }
            ]
        },
        ExportIntrinsics: getIntrinsics(dict),
        ExportOther: [
            {
                uniqueName: "/Lotus/StoreItems/Types/BoosterPacks/BaroTreasureBox",
                name: "Void Surplus",
                description:
                    "Exactly one item of unlabeled surplus inventory sold sight-unseen. One per customer please.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/AffinityBooster30DayStoreItem",
                name: "30 Day Affinity Booster",
                description: "Doubles the rate at which you earn affinity. Upgrade your weapons and Warframes faster.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/AffinityBooster3DayStoreItem",
                name: "3 Day Affinity Booster",
                description: "Doubles the rate at which you earn affinity. Upgrade your weapons and Warframes faster.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/AffinityBooster7DayStoreItem",
                name: "7 Day Affinity Booster",
                description: "Doubles the rate at which you earn affinity. Upgrade your weapons and Warframes faster.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/AffinityBooster90DayStoreItem",
                name: "90-Day Affinity Booster",
                description: "Doubles the rate at which you earn affinity. Upgrade your weapons and Warframes faster.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/CreditBooster30DayStoreItem",
                name: "30 Day Credit Booster",
                description: "Doubles the amount of credits you get from pickups and mission rewards.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/CreditBooster3DayStoreItem",
                name: "3 Day Credit Booster",
                description: "Doubles the amount of credits you get from pickups and mission rewards.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/CreditBooster7DayStoreItem",
                name: "7 Day Credit Booster",
                description: "Doubles the amount of credits you get from pickups and mission rewards.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/CreditBooster90DayStoreItem",
                name: "90-Day Credit Booster",
                description: "Doubles the amount of credits you get from pickups and mission rewards.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/ModDropChanceBooster30DayStoreItem",
                name: "30 Day Mod Drop Chance Booster",
                description: "Doubles the chance that enemies will drop Mods, Endo, and Arcanes.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/ModDropChanceBooster3DayStoreItem",
                name: "3 Day Mod Drop Chance Booster",
                description: "Doubles the chance that enemies will drop Mods, Endo, and Arcanes.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/ModDropChanceBooster7DayStoreItem",
                name: "7 Day Mod Drop Chance Booster",
                description: "Doubles the chance that enemies will drop Mods, Endo, and Arcanes.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/ModDropChanceBooster90DayStoreItem",
                name: "90-Day Mod Drop Chance Booster",
                description: "Doubles the chance that enemies will drop Mods, Endo, and Arcanes.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/ResourceAmount30DayStoreItem",
                name: "30 Day Resource Booster",
                description: "Doubles the amount of resources you get from pickups.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/ResourceAmount3DayStoreItem",
                name: "3 Day Resource Booster",
                description: "Doubles the amount of resources you get from pickups.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/ResourceAmount7DayStoreItem",
                name: "7 Day Resource Booster",
                description: "Doubles the amount of resources you get from pickups.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/ResourceAmount90DayStoreItem",
                name: "90-Day Resource Booster",
                description: "Doubles the amount of resources you get from pickups.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/ResourceDropChance30DayStoreItem",
                name: "30 Day Resource Drop Chance Booster",
                description: "Doubles the chance of resource drops.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/ResourceDropChance3DayStoreItem",
                name: "3 Day Resource Drop Chance Booster",
                description: "Doubles the chance of resource drops.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Boosters/ResourceDropChance7DayStoreItem",
                name: "7 Day Resource Drop Chance Booster",
                description: "Doubles the chance of resource drops.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KavatBaseColorPack",
                name: "Kavat Gene-Masking Kit",
                description: "Change a kavat's coat coloration to match that of the Adarza or Smeeta Kavat species."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KavatColorPackCeph",
                name: "Neura Kavat Gene-Masking Kit",
                description: "Customize a Kavat's fur color with these isolated DNA sequences.",
                excludeFromCodex: true
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KavatColorPackContest",
                name: "Deaeira Kavat Gene-Masking Kit",
                description:
                    "Surviving records state the Deaeira Kavat strain was developed and much-favored by the Orokin. [Tenno's Best Friend Contest winner]"
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KavatColorPackDaybreak",
                name: "Daybreak Kavat Gene-Masking Kit",
                description:
                    "The Orokin engineered this DNA structure to make their Kavats embody the season of renewal."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KavatColorPackDuviri",
                name: "Kexat Kavat Gene-Masking Kit",
                description:
                    "Bring \u2018The Tales of Duviri\u2019 back to the Origin System with this Kexat skin for your Kavat."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KavatColorPackEntrati",
                name: "Kalymos Kavat Gene-Masking Kit",
                description: "Give your Kavat the look of Albrecht Entrati\u2019s loyal companion, Kalymos."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KavatColorPackFeral",
                name: "Moonless Kavat Gene-Masking Kit",
                description: "A kavat pattern ideal for the nighttime hunt."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KavatColorPackHyekka",
                name: "Hyekka Gene-Masking Kit",
                description: "Degenerate a kavat into a furless Hyekka by altering its DNA structure."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KavatColorPackKrest",
                name: "Krest Gene-Masking Kit",
                description: "Customize a Kavat\u2019s fur color with these isolated DNA sequences."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KavatColorPackNesyr",
                name: "Nesyr Gene-Masking Kit",
                description: "Customize a Kavat\u2019s fur color with these isolated DNA sequences."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KavatColorPackNexus",
                name: "Nexus Gene-Masking Kit",
                description: "Customize a Kavat\u2019s fur color with these isolated DNA sequences."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KavatColorPackPrimeA",
                name: "Tibor Prime Gene-Masking Kit",
                description: "Complement your Kavat\u2019s Tibor Armor with this elegant primed gene-mask."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KavatColorPackSolstice",
                name: "Solstice Kavat Gene-Masking Kit",
                description: "Customize a Kavat\u2019s fur color with these isolated DNA sequences."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KavatColorPackXmas",
                name: "Argyl Gene-Masking Kit",
                description: "Customize a Kavat\u2019s fur color with these isolated DNA sequences."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KubrowBaseColorPack",
                name: "Basic Gene-Masking Kit",
                description:
                    "Provides basic masking options for a Kubrow's innate DNA structure, allowing coat color customization."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KubrowColorPackCandyCane",
                name: "Nistlebrush Gene-Masking Kit",
                description:
                    "This tool provides all of the genetic information to mask a Kubrow's innate DNA structure and allows a Tenno to customize its fur pattern."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KubrowColorPackContest",
                name: "Heino Kubrow Gene-Masking Kit",
                description:
                    "Fur pattern matching your Kubrow's Heino ancestors, from a gene-line preserved by Kubrow master Skvirl. [Tenno's Best Friend Contest winner]"
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KubrowColorPackDaybreak",
                name: "Daybreak Kubrow Gene-Masking Kit",
                description:
                    "The Orokin engineered this DNA structure to make their Kubrows embody the season of renewal."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KubrowColorPackLiquid",
                name: "Arklut Gene-Masking Kit",
                description:
                    "This tool provides all of the genetic information to mask a Kubrow's innate DNA structure and allows a Tenno to customize its fur pattern."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KubrowColorPackReindeer",
                name: "Nart-Deer Gene-Masking Kit",
                description:
                    "This tool provides all of the genetic information to mask a Kubrow's innate DNA structure and allows a Tenno to customize its fur pattern."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KubrowColorPackSolstice",
                name: "Solstice Kubrow Gene-Masking Kit",
                description:
                    "This tool provides all of the genetic information to mask a Kubrow's innate DNA structure and allows a Tenno to customize its fur pattern."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KubrowColorPackSpeckled",
                name: "Telmatian Gene-Masking Kit",
                description:
                    "This tool provides all of the genetic information to mask a Kubrow's innate DNA structure and match the fur pattern of its Telmatian Kubrow ancestors."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KubrowColorPackStriped",
                name: "Savenga Gene-Masking Kit",
                description:
                    "This tool provides all of the genetic information to mask a Kubrow's innate DNA structure and match the fur pattern of its Savenga Kubrow ancestors."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KubrowColorPackTiger",
                name: "Tigrol Gene-Masking Kit",
                description:
                    "This tool provides all of the genetic information to mask a Kubrow's innate DNA structure and match the fur pattern of its Tigrol Kubrow ancestors."
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/KubrowKavatContestPack",
                name: "Prized Companion Skin Pack",
                description:
                    "Raise a prize-winning companion with this fur-patterning for Kubrow and Kavat. Contains both the Heino Kubrow Fur Pattern and Deaeira Kavat Fur Pattern. [Tenno's Best Friend Contest winners]"
            },
            {
                uniqueName: "/Lotus/Types/StoreItems/Packages/VTEosArmourBundle",
                name: "Eos Prime Armor Set",
                description: "A full set of decorative armor for your Warframe."
            }
        ]
    };
};

const getUpgrades = (dict: Record<string, string>): IUpgrade[] => {
    const res: IUpgrade[] = [];
    for (const [uniqueName, data] of Object.entries(ExportUpgrades)) {
        res.push({
            uniqueName,
            ...data,
            name: getString(data.name, dict),
            description: data.description ? [getString(data.description, dict)] : undefined
            // TODO: levelStats
        });
    }
    return res;
};

const fillInPlaceholders = (str: string, subs: Record<string, string>): string => {
    for (const [key, value] of Object.entries(subs)) {
        str = str.replace(`|${key}|`, value);
    }
    return str;
};

const getModSets = (dict: Record<string, string>): IModSet[] => {
    const res: IModSet[] = [];
    for (const [uniqueName, data] of Object.entries(ExportModSet)) {
        const description = getString(data.description, dict);
        res.push({
            uniqueName,
            numUpgradesInSet: data.numUpgradesInSet,
            stats: data.levelStats.map(x => fillInPlaceholders(description, x))
        });
    }
    return res;
};

const getAvionics = (dict: Record<string, string>): IAvionicsFocus[] => {
    const res: IAvionicsFocus[] = [];
    for (const [uniqueName, data] of Object.entries(ExportAvionics)) {
        res.push({
            uniqueName,
            ...data,
            name: getString(data.name, dict),
            levelStats: [] // TODO
        });
    }
    return res;
};

const getFocusUpgrades = (dict: Record<string, string>): IAvionicsFocus[] => {
    const res: IAvionicsFocus[] = [];
    for (const [uniqueName, data] of Object.entries(ExportFocusUpgrades)) {
        const description = getString(data.description, dict);
        res.push({
            uniqueName,
            ...data,
            name: getString(data.name, dict),
            levelStats: data.levelStats.map(x => ({
                stats: [fillInPlaceholders(description, x)]
            }))
        });
    }
    return res;
};

export const getExportUpgrades = (lang: string): IExportUpgrades => {
    const dict = getDict(lang);
    return {
        ExportUpgrades: getUpgrades(dict),
        ExportModSet: getModSets(dict),
        ExportAvionics: getAvionics(dict),
        ExportFocusUpgrades: getFocusUpgrades(dict)
    };
};

const getWarframes = (dict: Record<string, string>): IWarframe[] => {
    const res: IWarframe[] = [];
    for (const [uniqueName, data] of Object.entries(ExportWarframes)) {
        res.push({
            uniqueName,
            ...data,
            name: getString(data.name, dict),
            description: getString(data.description, dict),
            longDescription: data.longDescription ? getString(data.longDescription, dict) : undefined,
            passiveDescription: data.passiveDescription ? getString(data.passiveDescription, dict) : undefined,
            abilities: data.abilities.map(x => ({
                abilityUniqueName: x.uniqueName,
                abilityName: getString(x.name ?? "", dict),
                description: getString(x.description ?? "", dict)
            }))
        });
    }
    return res;
};

const getAbilities = (dict: Record<string, string>): IAbility[] => {
    const res: IAbility[] = [];
    for (const [uniqueName, data] of Object.entries(ExportAbilities)) {
        if (data.name && data.description) {
            res.push({
                abilityUniqueName: uniqueName,
                abilityName: getString(data.name, dict),
                description: getString(data.description, dict)
            });
        }
    }
    return res;
};

export const getExportWarframes = (lang: string): IExportWarframes => {
    const dict = getDict(lang);
    return {
        ExportWarframes: getWarframes(dict),
        ExportAbilities: getAbilities(dict)
    };
};

const getWeapons = (dict: Record<string, string>): IWeapon[] => {
    const res: IWeapon[] = [];
    for (const [uniqueName, data] of Object.entries(ExportWeapons)) {
        if (
            data.damagePerShot &&
            data.totalDamage !== undefined &&
            data.criticalChance !== undefined &&
            data.criticalMultiplier !== undefined &&
            data.procChance !== undefined &&
            data.fireRate !== undefined &&
            data.masteryReq !== undefined
        ) {
            res.push({
                name: getString(data.name, dict),
                uniqueName,
                codexSecret: data.codexSecret,
                damagePerShot: data.damagePerShot,
                totalDamage: data.totalDamage,
                description: getString(data.description, dict),
                criticalChance: data.criticalChance,
                criticalMultiplier: data.criticalMultiplier,
                procChance: data.procChance,
                fireRate: data.fireRate,
                masteryReq: data.masteryReq,
                productCategory: data.productCategory,
                slot: data.slot,
                accuracy: data.accuracy,
                omegaAttenuation: data.omegaAttenuation,
                noise: data.noise,
                trigger: data.trigger,
                magazineSize: data.magazineSize,
                reloadTime: data.reloadTime,
                multishot: data.multishot,
                blockingAngle: data.blockingAngle,
                comboDuration: data.comboDuration,
                followThrough: data.followThrough,
                range: data.range,
                slamAttack: data.slamAttack,
                slamRadialDamage: data.slamRadialDamage,
                slamRadius: data.slamRadius,
                slideAttack: data.slideAttack,
                heavyAttackDamage: data.heavyAttackDamage,
                heavySlamAttack: data.heavySlamAttack,
                heavySlamRadialDamage: data.heavySlamRadialDamage,
                heavySlamRadius: data.heavySlamRadius,
                windUp: data.windUp,
                maxLevelCap: data.maxLevelCap,
                sentinel: data.sentinel,
                excludeFromCodex: data.excludeFromCodex,
                primeOmegaAttenuation: data.primeOmegaAttenuation
            });
        }
    }
    return res;
};

const getRailjackWeapons = (dict: Record<string, string>): IRailjackWeapon[] => {
    const res: IRailjackWeapon[] = [];
    for (const [uniqueName, data] of Object.entries(ExportRailjackWeapons)) {
        if (
            data.damagePerShot &&
            data.totalDamage !== undefined &&
            data.criticalChance !== undefined &&
            data.criticalMultiplier !== undefined &&
            data.procChance !== undefined &&
            data.fireRate !== undefined &&
            data.masteryReq !== undefined &&
            data.slot !== undefined &&
            data.accuracy !== undefined &&
            data.noise !== undefined &&
            data.trigger !== undefined &&
            data.magazineSize !== undefined &&
            data.reloadTime !== undefined &&
            data.multishot !== undefined
        ) {
            res.push({
                name: getString(data.name, dict),
                uniqueName,
                codexSecret: data.codexSecret,
                damagePerShot: data.damagePerShot,
                totalDamage: data.totalDamage,
                description: getString(data.description, dict),
                criticalChance: data.criticalChance,
                criticalMultiplier: data.criticalMultiplier,
                procChance: data.procChance,
                fireRate: data.fireRate,
                masteryReq: data.masteryReq,
                productCategory: data.productCategory,
                excludeFromCodex: !!data.excludeFromCodex,
                slot: data.slot,
                accuracy: data.accuracy,
                omegaAttenuation: data.omegaAttenuation,
                noise: data.noise,
                trigger: data.trigger,
                magazineSize: data.magazineSize,
                reloadTime: data.reloadTime,
                multishot: data.multishot
            });
        }
    }
    return res;
};

export const getExportWeapons = (lang: string): IExportWeapons => {
    const dict = getDict(lang);
    return {
        ExportWeapons: getWeapons(dict),
        ExportRailjackWeapons: getRailjackWeapons(dict)
    };
};

const mapIcons = <T extends { icon?: string }>(res: IIconMapping[], obj: Record<string, T>): void => {
    for (const [uniqueName, data] of Object.entries(obj)) {
        if (data.icon) {
            res.push({
                uniqueName,
                textureLocation: data.icon + "!00_abcdefghijklmnopqrstuv"
            });
        }
    }
};

export const getExportManifest = (): IExportManifest => {
    const res: IIconMapping[] = [];
    mapIcons(res, ExportAbilities);
    mapIcons(res, ExportArcanes);
    mapIcons(res, ExportCustoms);
    mapIcons(res, ExportDrones);
    mapIcons(res, ExportFlavour);
    mapIcons(res, ExportFocusUpgrades);
    mapIcons(res, ExportFusionBundles);
    mapIcons(res, ExportGear);
    mapIcons(res, ExportIntrinsics);
    mapIcons(res, ExportKeys);
    mapIcons(res, ExportModSet);
    mapIcons(res, ExportNightwave.challenges);
    for (const item of ExportNightwave.rewards) {
        if (item.icon) {
            res.push({
                uniqueName: item.uniqueName,
                textureLocation: item.icon + "!00_abcdefghijklmnopqrstuv"
            });
        }
    }
    mapIcons(res, ExportRailjackWeapons);
    mapIcons(res, ExportRelics);
    mapIcons(res, ExportResources);
    mapIcons(res, ExportSentinels);
    mapIcons(res, ExportUpgrades);
    mapIcons(res, ExportWarframes);
    mapIcons(res, ExportWeapons);
    return { Manifest: res };
};
