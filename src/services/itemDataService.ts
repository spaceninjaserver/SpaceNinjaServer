import { getIndexAfter } from "@/src/helpers/stringHelpers";
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
    ExportRecipes,
    ExportWarframes,
    ExportWeapons,
    IPowersuit,
    IRecipe
} from "warframe-public-export-plus";

export type WeaponTypeInternal =
    | "LongGuns"
    | "Pistols"
    | "Melee"
    | "SpaceMelee"
    | "SpaceGuns"
    | "SentinelWeapons"
    | "OperatorAmps"
    | "SpecialItems";

export const getWeaponType = (weaponName: string): WeaponTypeInternal => {
    const weaponInfo = ExportWeapons[weaponName];

    if (!weaponInfo) {
        throw new Error(`unknown weapon ${weaponName}`);
    }

    // Many non-weapon items are "Pistols" in Public Export, so some duck typing is needed.
    if (weaponInfo.totalDamage == 0) {
        throw new Error(`${weaponName} doesn't quack like a weapon`);
    }

    const weaponType = weaponInfo.productCategory;

    if (!weaponType) {
        logger.error(`unknown weapon category for item ${weaponName}`);
        throw new Error(`unknown weapon category for item ${weaponName}`);
    }

    return weaponType;
};

export const getRecipe = (uniqueName: string): IRecipe | undefined => {
    return ExportRecipes[uniqueName];
};

export const getExalted = (uniqueName: string) => {
    const suit = getSuitByUniqueName(uniqueName);
    if (suit?.exalted !== undefined) {
        return suit.exalted;
    } else {
        return false;
    }
};

export const getItemCategoryByUniqueName = (uniqueName: string) => {
    //Lotus/Types/Items/MiscItems/PolymerBundle

    let splitWord = "Items/";
    if (!uniqueName.includes("/Items/")) {
        splitWord = "/Types/";
    }

    const index = getIndexAfter(uniqueName, splitWord);
    if (index === -1) {
        logger.error(`error parsing item category ${uniqueName}`);
        throw new Error(`error parsing item category ${uniqueName}`);
    }
    const category = uniqueName.substring(index).split("/")[0];
    return category;
};

export const getSuitByUniqueName = (uniqueName: string): IPowersuit | undefined => {
    return ExportWarframes[uniqueName];
};

export const getString = (key: string, lang: string | undefined): string => {
    let dict;
    switch (lang) {
        case "de":
            dict = dict_de
        break;

        case "es":
            dict = dict_es
        break;

        case "fr":
            dict = dict_fr
        break;
            
        case "it":
            dict = dict_it
        break;

        case "ja":
            dict = dict_ja
        break;

        case "ko":
            dict = dict_ko
        break;

        case "pl":
            dict = dict_pl
        break;

        case "pt":
            dict = dict_pt
        break;

        case "ru":
            dict = dict_ru
        break;

        case "tc":
            dict = dict_tc
        break;

        case "th":
            dict = dict_th
        break;

        case "tr":
            dict = dict_tr
        break;

        case "uk":
            dict = dict_uk
        break;

        case "zh":
            dict = dict_zh
        break;
        
        case "en":
        default:
            dict = dict_en
            break;
    }

    return dict[key] ?? key;
};
