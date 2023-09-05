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
    new Items({ category: [category] }).reduce((acc, item) => {
        acc[item.name!.replace("'S", "'s")] = item.uniqueName!;
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
        .flatMap(item => item.components || [])
        .filter(item => item.drops && item.drops[0])
        .map(item => [item.drops![0].type, item.uniqueName])
);
craftNames["Forma Blueprint"] = "/Lotus/Types/Recipes/Components/FormaBlueprint";

export const blueprintNames: ImportAssertions = Object.fromEntries(
    Object.keys(craftNames)
        .filter(name => name.includes("Blueprint"))
        .map(name => [name, craftNames[name]])
);
