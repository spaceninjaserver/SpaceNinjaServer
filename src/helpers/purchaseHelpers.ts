import { SlotPurchase, SlotPurchaseName } from "@/src/types/purchaseTypes";

export const slotPurchaseNameToSlotName: SlotPurchase = {
    SuitSlotItem: { name: "SuitBin", purchaseQuantity: 1 },
    TwoSentinelSlotItem: { name: "SentinelBin", purchaseQuantity: 2 },
    TwoWeaponSlotItem: { name: "WeaponBin", purchaseQuantity: 2 },
    SpaceSuitSlotItem: { name: "SpaceSuitBin", purchaseQuantity: 1 },
    TwoSpaceWeaponSlotItem: { name: "SpaceWeaponBin", purchaseQuantity: 2 },
    MechSlotItem: { name: "MechBin", purchaseQuantity: 1 },
    TwoOperatorWeaponSlotItem: { name: "OperatorAmpBin", purchaseQuantity: 2 },
    RandomModSlotItem: { name: "RandomModBin", purchaseQuantity: 3 },
    TwoCrewShipSalvageSlotItem: { name: "CrewShipSalvageBin", purchaseQuantity: 2 },
    CrewMemberSlotItem: { name: "CrewMemberBin", purchaseQuantity: 1 }
};

export const isSlotPurchaseName = (slotPurchaseName: string): slotPurchaseName is SlotPurchaseName => {
    return slotPurchaseName in slotPurchaseNameToSlotName;
};

export const parseSlotPurchaseName = (slotPurchaseName: string): SlotPurchaseName => {
    if (!isSlotPurchaseName(slotPurchaseName)) throw new Error(`invalid slot name ${slotPurchaseName}`);
    return slotPurchaseName;
};
