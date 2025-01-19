import { slotPurchaseNameToSlotName } from "@/src/services/purchaseService";
import { SlotNames, SlotPurchaseName } from "@/src/types/purchaseTypes";
import { InventorySlot } from "@/src/types/inventoryTypes/inventoryTypes";

export const isSlotPurchaseName = (slotPurchaseName: string): slotPurchaseName is SlotPurchaseName => {
    return slotPurchaseName in slotPurchaseNameToSlotName;
};

export const parseSlotPurchaseName = (slotPurchaseName: string): SlotPurchaseName => {
    if (!isSlotPurchaseName(slotPurchaseName)) throw new Error(`invalid slot name ${slotPurchaseName}`);
    return slotPurchaseName;
};

export const productCategoryToSlotName: Record<string, SlotNames> = {
    Suits: InventorySlot.SUITS,
    Pistols: InventorySlot.WEAPONS,
    Melee: InventorySlot.WEAPONS,
    LongGuns: InventorySlot.WEAPONS,
    SpaceSuits: InventorySlot.SPACESUITS,
    SpaceGuns: InventorySlot.SPACESUITS,
    SpaceMelee: InventorySlot.SPACESUITS,
    Sentinels: InventorySlot.SENTINELS,
    SentinelWeapons: InventorySlot.SENTINELS,
    MechSuits: InventorySlot.MECHSUITS
};
