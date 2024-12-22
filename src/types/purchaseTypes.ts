export interface IPurchaseRequest {
    PurchaseParams: IPurchaseParams;
    buildLabel: string;
}

export interface IPurchaseParams {
    Source: number;
    SourceId?: string; // for Source 7 & 18
    StoreItem: string;
    StorePage: string;
    SearchTerm: string;
    CurrentLocation: string;
    Quantity: number;
    UsePremium: boolean;
    ExpectedPrice: number;
    SyndicateTag?: string; // for Source 2
    UseFreeFavor?: boolean; // for Source 2
}

export type IInventoryChanges = Record<string, IBinChanges | object[]>;

export interface IPurchaseResponse {
    InventoryChanges: IInventoryChanges;
    Standing?: {
        Tag: string;
        Standing: number;
    }[];
}

export type IBinChanges = {
    count: number;
    platinum: number;
    Slots: number;
    Extra?: number;
};

export type SlotPurchaseName =
    | "SuitSlotItem"
    | "TwoSentinelSlotItem"
    | "TwoWeaponSlotItem"
    | "SpaceSuitSlotItem"
    | "TwoSpaceWeaponSlotItem"
    | "MechSlotItem"
    | "TwoOperatorWeaponSlotItem"
    | "RandomModSlotItem"
    | "TwoCrewShipSalvageSlotItem"
    | "CrewMemberSlotItem";

export type SlotNames =
    | "SuitBin"
    | "WeaponBin"
    | "MechBin"
    | "PveBonusLoadoutBin"
    | "SentinelBin"
    | "SpaceSuitBin"
    | "SpaceWeaponBin"
    | "OperatorAmpBin"
    | "RandomModBin"
    | "CrewShipSalvageBin"
    | "CrewMemberBin";

export type SlotPurchase = {
    [P in SlotPurchaseName]: { name: SlotNames; slotsPerPurchase: number };
};
