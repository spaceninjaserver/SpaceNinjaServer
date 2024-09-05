export interface IPurchaseRequest {
    PurchaseParams: IPurchaseParams;
    buildLabel: string;
}

export interface IPurchaseParams {
    Source: number;
    StoreItem: string;
    StorePage: string;
    SearchTerm: string;
    CurrentLocation: string;
    Quantity: number;
    UsePremium: boolean;
    ExpectedPrice: number;
}

export type IInventoryChanges = Record<string, IBinChanges | object[]>;

export type IBinChanges = {
    count: number;
    platinum: number;
    Slots: number;
    Extra?: number;
};

export type SlotPurchaseName =
    | "SuitSlotItem"
    | "TwoSentinelSlotItem"
    | "TwoWeaponSlotItem";

export type SlotNames =
    | "SuitBin"
    | "WeaponBin"
    | "MechBin"
    | "PveBonusLoadoutBin"
    | "SentinelBin";

export type SlotPurchase = {
    [P in SlotPurchaseName]: { name: SlotNames; slotsPerPurchase: number };
};
