import { dict_en, ExportRecipes, ExportSentinels, ExportWarframes, IRecipe } from "warframe-public-export-plus";
import { InventorySlot, TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";

export const getRecipe = (uniqueName: string): IRecipe | undefined => {
    return ExportRecipes[uniqueName];
};

export const getDefaultGear = (itemType: string): string[] | null => {
    if (itemType in ExportWarframes) {
        return ExportWarframes[itemType]?.exalted ?? null;
    }

    if (itemType in ExportSentinels) {
        const { defaultUpgrades = [], defaultWeapon } = ExportSentinels[itemType] || {};
        const defaultGear = [
            ...defaultUpgrades.map(upgrade => upgrade.ItemType),
            ...(defaultWeapon ? [defaultWeapon] : [])
        ];
        return defaultGear.length ? defaultGear : null;
    }

    return null;
};

export const getEnglishString = (key: string): string => {
    return dict_en[key] ?? key;
};

export const getBinKey = (equipmentType: TEquipmentKey): InventorySlot | null => {
    switch (equipmentType) {
        case "Suits":
            return InventorySlot.SUITS;
        case "MechSuits":
            return InventorySlot.MECHSUITS;
        case "LongGuns":
        case "Pistols":
        case "Melee":
            return InventorySlot.WEAPONS;
        case "Sentinels":
        case "SentinelWeapons":
        case "MoaPets":
        case "KubrowPets":
            return InventorySlot.SENTINELS;
        case "SpaceSuits":
        case "Hoverboards":
            return InventorySlot.SPACESUITS;
        case "SpaceGuns":
        case "SpaceMelee":
            return InventorySlot.SPACEWEAPON;
        case "OperatorAmps":
            return InventorySlot.OPERATORAMP;
        default:
            return null;
    }
};
