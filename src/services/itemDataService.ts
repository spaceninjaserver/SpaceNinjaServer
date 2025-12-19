import type { IKeyChainRequest } from "../types/requestTypes.ts";
import type {
    IDefaultUpgrade,
    IInboxMessage,
    IKey,
    IMissionReward,
    IRecipe,
    ISyndicate,
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
    ExportBoosters,
    ExportBundles,
    ExportCustoms,
    ExportDojoRecipes,
    ExportDrones,
    ExportGear,
    ExportKeys,
    ExportRailjackWeapons,
    ExportRecipes,
    ExportResources,
    ExportSentinels,
    ExportSyndicates,
    ExportWarframes,
    ExportWeapons
} from "warframe-public-export-plus";
import type { IMessage } from "../models/inboxModel.ts";
import { logger } from "../utils/logger.ts";
import { version_compare } from "../helpers/inventoryHelpers.ts";
import vorsPrizePreU40Rewards from "../../static/fixed_responses/vorsPrizePreU40Rewards.json" with { type: "json" };
import gameToBuildVersion from "../../static/fixed_responses/gameToBuildVersion.json" with { type: "json" };
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

export const getRecipe = (uniqueName: string): IRecipe | undefined => {
    // Handle crafting of archwing summon for versions prior to 39.0.0 as this blueprint was removed then.
    if (uniqueName == "/Lotus/Types/Recipes/EidolonRecipes/OpenArchwingSummonBlueprint") {
        return {
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
        };
    }

    return ExportRecipes[uniqueName];
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
): { levelKeyRewards?: IMissionReward; levelKeyRewards2?: TReward[] } => {
    const key = ExportKeys[levelKey] as IKey | undefined;

    const levelKeyRewards = key?.missionReward;
    let levelKeyRewards2 = key?.rewards;

    if (!levelKeyRewards && !levelKeyRewards2) {
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
        levelKeyRewards2
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
