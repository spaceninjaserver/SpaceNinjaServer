import { slotPurchaseNameToSlotName } from "@/src/services/purchaseService";
import { SlotPurchaseName } from "@/src/types/purchaseTypes";

export const isSlotPurchaseName = (slotPurchaseName: string): slotPurchaseName is SlotPurchaseName => {
    return slotPurchaseName in slotPurchaseNameToSlotName;
};

export const parseSlotPurchaseName = (slotPurchaseName: string): SlotPurchaseName => {
    if (!isSlotPurchaseName(slotPurchaseName)) throw new Error(`invalid slot name ${slotPurchaseName}`);
    return slotPurchaseName;
};
