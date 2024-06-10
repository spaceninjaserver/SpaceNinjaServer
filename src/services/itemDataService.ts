import { getIndexAfter } from "@/src/helpers/stringHelpers";
import { logger } from "@/src/utils/logger";
import Items, { Buildable, Category, MinimalItem, Warframe, Weapon } from "warframe-items";
import badItems from "@/static/json/exclude-mods.json";
import { dict_en, ExportWarframes, ExportWeapons, IPowersuit } from "warframe-public-export-plus";

export type MinWarframe = Omit<Warframe, "patchlogs">;
export type MinWeapon = Omit<Weapon, "patchlogs">;
export type MinItem = Omit<MinimalItem, "patchlogs">;

export const warframes: MinWarframe[] = Array.from(new Items({ category: ["Warframes"] }) as Warframe[])
    .filter(item => {
        return item.uniqueName.substring(0, 30) != "/Lotus/Powersuits/EntratiMech/";
    })
    .map(item => {
        const next = { ...item };
        delete next.patchlogs;
        return next;
    });

export type WeaponTypeInternal =
    | "LongGuns"
    | "Pistols"
    | "Melee"
    | "SpaceMelee"
    | "SpaceGuns"
    | "SentinelWeapons"
    | "OperatorAmps"
    | "SpecialItems";

export const items: MinItem[] = Array.from(new Items({ category: ["All"] }) as MinimalItem[]).map(item => {
    const next = { ...item };
    delete next.patchlogs;
    return next;
});

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

const getNamesObj = (category: Category) =>
    new Items({ category: [category] }).reduce<{ [index: string]: string }>((acc, item) => {
        if (!(item.uniqueName! in badItems)) {
            acc[item.name!.replace("'S", "'s")] = item.uniqueName!;
        }
        return acc;
    }, {});

export const modNames = getNamesObj("Mods");
export const resourceNames = getNamesObj("Resources");
export const miscNames = getNamesObj("Misc");
export const relicNames = getNamesObj("Relics");
export const skinNames = getNamesObj("Skins");
export const arcaneNames = getNamesObj("Arcanes");
export const gearNames = getNamesObj("Gear");
//logger.debug(`gear names`, { gearNames });

export const craftNames = Object.fromEntries(
    (
        new Items({
            category: [
                "Warframes",
                "Gear",
                "Melee",
                "Primary",
                "Secondary",
                "Sentinels",
                "Misc",
                "Arch-Gun",
                "Arch-Melee"
            ]
        }) as Warframe[]
    )
        .flatMap(item => item.components || [])
        .filter(item => item.drops && item.drops[0])
        .map(item => [item.drops![0].type, item.uniqueName])
);

export const blueprintNames = Object.fromEntries(
    Object.keys(craftNames)
        .filter(name => name.includes("Blueprint"))
        .map(name => [name, craftNames[name]])
);

const buildables = items.filter(item => !!(item as Buildable).components);

export const getItemByBlueprint = (uniqueName: string): (MinItem & Buildable) | undefined => {
    const item = buildables.find(item =>
        (item as Buildable).components?.find(component => component.uniqueName === uniqueName)
    );
    return item;
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

export const getItemByUniqueName = (uniqueName: string) => {
    const item = items.find(item => item.uniqueName === uniqueName);
    return item;
};

export const getItemByName = (name: string) => {
    const item = items.find(item => item.name === name);
    return item;
};

export const getEnglishString = (key: string): string => {
    return dict_en[key] ?? key;
};
