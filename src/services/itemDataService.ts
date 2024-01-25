import { logger } from "@/src/utils/logger";
import Items, { Buildable, Category, Item, Warframe, Weapon } from "warframe-items";

type MinWeapon = Omit<Weapon, "patchlogs">;
type MinItem = Omit<Item, "patchlogs">;

export const weapons: MinWeapon[] = (new Items({ category: ["Primary", "Secondary", "Melee"] }) as Weapon[]).map(
    item => {
        const next = { ...item };
        delete next.patchlogs;
        return next;
    }
);

export type WeaponTypeInternal = "LongGuns" | "Pistols" | "Melee";

export const items: MinItem[] = new Items({ category: ["All"] }).map(item => {
    const next = { ...item };
    delete next.patchlogs;
    return next;
});

export const getWeaponType = (weaponName: string) => {
    const weaponInfo = weapons.find(i => i.uniqueName === weaponName);

    if (!weaponInfo) {
        throw new Error(`unknown weapon ${weaponName}`);
    }

    const weaponType = weaponInfo.productCategory as WeaponTypeInternal;

    if (!weaponType) {
        logger.error(`unknown weapon category for item ${weaponName}`);
        throw new Error(`unknown weapon category for item ${weaponName}`);
    }

    return weaponType;
};

const getNamesObj = (category: Category) =>
    new Items({ category: [category] }).reduce<{ [index: string]: string }>((acc, item) => {
        acc[item.name!.replace("'S", "'s")] = item.uniqueName!;
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
    const item = buildables.find(
        item => (item as Buildable).components?.find(component => component.uniqueName === uniqueName)
    );
    return item;
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

export const getIndexAfter = (str: string, searchWord: string) => {
    const index = str.indexOf(searchWord);
    if (index === -1) {
        return -1;
    }
    return index + searchWord.length;
};

export const getItemByUniqueName = (uniqueName: string) => {
    const item = items.find(item => item.uniqueName === uniqueName);
    return item;
};

export const getItemByName = (name: string) => {
    const item = items.find(item => item.name === name);
    return item;
};
