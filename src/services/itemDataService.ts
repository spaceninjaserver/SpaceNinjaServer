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

export const getKeyChainItems = ({ KeyChain, ChainStage }: IKeyChainRequest): string[] => {
    const chainStages = ExportKeys[KeyChain].chainStages;
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
        if (uniqueName == "/Lotus/Types/BoosterPacks/CommonFusionPack") {
            return {
                name: "/Lotus/Language/Items/CommonFusionPack",
                description: "/Lotus/Language/Items/CommonFusionPackDesc",
                icon: "/Lotus/Interface/Icons/Store/FusionCorePackBronze.png",
                components: [
                    { Item: "/Lotus/Upgrades/Mods/Fusers/RareModFuser", Rarity: "RARE", Amount: 1 },
                    { Item: "/Lotus/Upgrades/Mods/Fusers/UncommonModFuser", Rarity: "UNCOMMON", Amount: 1 },
                    { Item: "/Lotus/Upgrades/Mods/Fusers/CommonModFuser", Rarity: "COMMON", Amount: 1 }
                ],
                rarityWeightsPerRoll: [
                    { COMMON: 0.60000002, UNCOMMON: 0.40000001, RARE: 0, LEGENDARY: 0 },
                    { COMMON: 0.60000002, UNCOMMON: 0.40000001, RARE: 0, LEGENDARY: 0 },
                    { COMMON: 0.5, UNCOMMON: 0.30000001, RARE: 0.2, LEGENDARY: 0 }
                ],
                canGiveDuplicates: true,
                platinumCost: 55
            };
        }
        if (uniqueName == "/Lotus/Types/BoosterPacks/PremiumUncommonFusionPack") {
            return {
                name: "/Lotus/Language/Items/PremiumUncommonFusionPack",
                description: "/Lotus/Language/Items/PremiumUncommonFusionPackDesc",
                icon: "/Lotus/Interface/Icons/Store/FusionCorePackSilver.png",
                components: [
                    { Item: "/Lotus/Upgrades/Mods/Fusers/RareModFuser", Rarity: "RARE", Amount: 1 },
                    { Item: "/Lotus/Upgrades/Mods/Fusers/UncommonModFuser", Rarity: "UNCOMMON", Amount: 1 },
                    { Item: "/Lotus/Upgrades/Mods/Fusers/CommonModFuser", Rarity: "COMMON", Amount: 1 }
                ],
                rarityWeightsPerRoll: [
                    { COMMON: 0, UNCOMMON: 1, RARE: 0, LEGENDARY: 0 },
                    { COMMON: 0.5, UNCOMMON: 0.30000001, RARE: 0.2, LEGENDARY: 0 },
                    { COMMON: 0.5, UNCOMMON: 0.30000001, RARE: 0.2, LEGENDARY: 0 }
                ],
                canGiveDuplicates: true,
                platinumCost: 70
            };
        }
        if (uniqueName == "/Lotus/Types/BoosterPacks/PremiumRareFusionPack") {
            return {
                name: "/Lotus/Language/Items/PremiumRareFusionPack",
                description: "/Lotus/Language/Items/PremiumRareFusionPackDesc",
                icon: "/Lotus/Interface/Icons/Store/FusionCorePackGold.png",
                components: [
                    { Item: "/Lotus/Upgrades/Mods/Fusers/CommonModFuser", Rarity: "COMMON", Amount: 1 },
                    { Item: "/Lotus/Upgrades/Mods/Fusers/UncommonModFuser", Rarity: "UNCOMMON", Amount: 1 },
                    { Item: "/Lotus/Upgrades/Mods/Fusers/RareModFuser", Rarity: "RARE", Amount: 1 }
                ],
                rarityWeightsPerRoll: [
                    { COMMON: 0.5, UNCOMMON: 0.30000001, RARE: 0.2, LEGENDARY: 0 },
                    { COMMON: 0.5, UNCOMMON: 0.30000001, RARE: 0.2, LEGENDARY: 0 },
                    { COMMON: 0, UNCOMMON: 0, RARE: 1, LEGENDARY: 0 }
                ],
                canGiveDuplicates: true,
                platinumCost: 80
            };
        }
    }

    return ExportBoosterPacks[uniqueName];
};

export const getKey = (uniqueName: string): IKey | undefined => {
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
    let price: number | undefined;
    const isBundle = storeItemName in ExportBundles;
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
        const internalName = fromStoreItem(storeItemName);
        const boosterPack = getBoosterPack(fromStoreItem(storeItemName), buildLabel);
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
