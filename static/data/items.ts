import Items, { Category, Item, Warframe, Weapon } from "warframe-items";

type MinWeapon = Omit<Weapon, "patchlogs">;
type MinItem = Omit<Item, "patchlogs">;

export const weapons: MinWeapon[] = (new Items({ category: ["Primary", "Secondary", "Melee"] }) as Weapon[]).map(
    item => {
        const next = { ...item };
        delete next.patchlogs;
        return next;
    }
);

export const items: MinItem[] = new Items({ category: ["All"] }).map(item => {
    const next = { ...item };
    delete next.patchlogs;
    return next;
});

const getNamesObj = (category: Category) =>
    new Items({ category: [category] }).reduce((acc, i) => {
        acc[i.name!] = category !== "Mods" ? i.uniqueName! : i.uniqueName!.replace("'S", "'s");
        return acc;
    }, {} as ImportAssertions);

export const modNames = getNamesObj("Mods");
export const resourceNames = getNamesObj("Resources");
export const miscNames = getNamesObj("Misc");
export const relicNames = getNamesObj("Relics");
export const skinNames = getNamesObj("Skins");
export const arcaneNames = getNamesObj("Arcanes");
export const gearNames = getNamesObj("Gear");

export const craftNames: ImportAssertions = Object.fromEntries(
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
        .flatMap(j => j.components || [])
        .filter(i => i.drops && i.drops[0])
        .map(i => [i.drops![0].type, i.uniqueName])
);
craftNames["Forma Blueprint"] = "/Lotus/StoreItems/Types/Items/MiscItems/Forma";
