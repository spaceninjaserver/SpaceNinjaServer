import { getIndexAfter } from "@/src/helpers/stringHelpers";
import { logger } from "@/src/utils/logger";
import {
    dict_en,
    ExportRecipes,
    ExportSentinels,
    ExportWarframes,
    ExportWeapons,
    IPowersuit,
    IRecipe,
    ISentinel
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
    if (suit) {
        return suit.exalted || undefined;
    } else {
        return undefined;
    }
};

export const getSentinelDefaultEquipment = (uniqueName: string) => {
    const sentinel = getSentinelByUniqueName(uniqueName);
    if (sentinel) {
        return {
            defaultWeapon: sentinel.defaultWeapon || undefined,
            defaultUpgrades: sentinel.defaultUpgrades || undefined
        };
    } else {
        return undefined;
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

export const getSentinelByUniqueName = (uniqueName: string): ISentinel | undefined => {
    return ExportSentinels[uniqueName];
};

export const getEnglishString = (key: string): string => {
    return dict_en[key] ?? key;
};
