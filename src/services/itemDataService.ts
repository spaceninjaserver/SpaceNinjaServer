import { logger } from "@/src/utils/logger";
import Items, { Buildable, Category, Item, Warframe, Weapon } from "warframe-items";
import { log } from "winston";

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

const items2 = new Items({
    category: ["Warframes", "Gear", "Melee", "Primary", "Secondary", "Sentinels", "Misc", "Arch-Gun", "Arch-Melee"]
});

items2.flatMap(item => item.components || []);
// for (const item of items2) {
//     console.log(item.category === "Warframes");
//     if (item.category === "Warframes") {
//         console.log(item);
//     }
// }
