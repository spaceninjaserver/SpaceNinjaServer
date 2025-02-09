import { IKeyChainRequest } from "@/src/controllers/api/giveKeyChainTriggeredItemsController";
import { getIndexAfter } from "@/src/helpers/stringHelpers";
import { ITypeCount } from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";
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
    ExportCustoms,
    ExportGear,
    ExportKeys,
    ExportRecipes,
    ExportRegions,
    ExportResources,
    ExportSentinels,
    ExportWarframes,
    ExportWeapons,
    IPowersuit,
    IRecipe,
    IRegion
} from "warframe-public-export-plus";
import questCompletionItems from "@/static/fixed_responses/questCompletionRewards.json";

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
    return ExportRecipes[uniqueName];
};

export const getRecipeByResult = (resultType: string): IRecipe | undefined => {
    return Object.values(ExportRecipes).find(x => x.resultType == resultType);
};

export const getExalted = (uniqueName: string): string[] | undefined => {
    return getSuitByUniqueName(uniqueName)?.exalted;
};

export const getItemCategoryByUniqueName = (uniqueName: string): string => {
    //Lotus/Types/Items/MiscItems/PolymerBundle

    let splitWord = "Items/";
    if (!uniqueName.includes("/Items/")) {
        splitWord = "/Types/";
    }

    const index = getIndexAfter(uniqueName, splitWord);
    if (index === -1) {
        throw new Error(`error parsing item category ${uniqueName}`);
    }
    const category = uniqueName.substring(index).split("/")[0];
    return category;
};

export const getSuitByUniqueName = (uniqueName: string): IPowersuit | undefined => {
    return ExportWarframes[uniqueName];
};

export const getItemName = (uniqueName: string): string | undefined => {
    if (uniqueName in ExportArcanes) {
        return ExportArcanes[uniqueName].name;
    }
    if (uniqueName in ExportCustoms) {
        return ExportCustoms[uniqueName].name;
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

export const getKeyChainItems = ({ KeyChain, ChainStage }: IKeyChainRequest): string[] => {
    const chainStages = ExportKeys[KeyChain].chainStages;
    if (!chainStages) {
        throw new Error(`KeyChain ${KeyChain} does not contain chain stages`);
    }

    const keyChainStage = chainStages[ChainStage];
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

export const getLevelKeyRewards = (levelKey: string) => {
    const levelKeyData = ExportKeys[levelKey];
    if (!levelKeyData) {
        const error = `LevelKey ${levelKey} not found`;
        logger.error(error);
        throw new Error(error);
    }

    if (!levelKeyData.rewards) {
        const error = `LevelKey ${levelKey} does not contain rewards`;
        logger.error(error);
        throw new Error(error);
    }

    return levelKeyData.rewards;
};

export const getNode = (nodeName: string): IRegion => {
    const node = ExportRegions[nodeName];
    if (!node) {
        throw new Error(`Node ${nodeName} not found`);
    }

    return node;
};

export const getQuestCompletionItems = (questKey: string) => {
    const items = (questCompletionItems as unknown as Record<string, ITypeCount[]> | undefined)?.[questKey];

    if (!items) {
        logger.error(
            `Quest ${questKey} not found in questCompletionItems, quest completion items have not been given. This is a temporary solution`
        );
    }
    return items;
};

export const getKeyChainMessage = ({ KeyChain, ChainStage }: IKeyChainRequest) => {
    const chainStages = ExportKeys[KeyChain]?.chainStages;
    if (!chainStages) {
        throw new Error(`KeyChain ${KeyChain} does not contain chain stages`);
    }

    const keyChainStage = chainStages[ChainStage];
    if (!keyChainStage) {
        throw new Error(`KeyChainStage ${ChainStage} not found`);
    }

    const chainStageMessage = keyChainStage.messageToSendWhenTriggered;

    if (!chainStageMessage) {
        throw new Error(
            `client requested key chain message in keychain ${KeyChain} at stage ${ChainStage} but they did not exist`
        );
    }
    return chainStageMessage;
};
