import Items, { Item, Weapon } from "warframe-items";

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
