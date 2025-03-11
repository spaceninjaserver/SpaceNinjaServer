import { IEquipmentClient } from "./inventoryTypes/commonInventoryTypes";
import {
    IDroneClient,
    IInfestedFoundryClient,
    IMiscItem,
    ITypeCount,
    TEquipmentKey
} from "./inventoryTypes/inventoryTypes";

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
    ExtraPurchaseInfoJson?: string; // for Source 7
    IsWeekly?: boolean; // for Source 7
}

export type IInventoryChanges = {
    [_ in SlotNames]?: IBinChanges;
} & {
    [_ in TEquipmentKey]?: IEquipmentClient[];
} & {
    RegularCredits?: number;
    PremiumCredits?: number;
    PremiumCreditsFree?: number;
    InfestedFoundry?: IInfestedFoundryClient;
    Drones?: IDroneClient[];
    MiscItems?: IMiscItem[];
    EmailItems?: ITypeCount[];
} & Record<
        Exclude<
            string,
            | SlotNames
            | TEquipmentKey
            | "RegularCredits"
            | "PremiumCredits"
            | "PremiumCreditsFree"
            | "InfestedFoundry"
            | "Drones"
            | "MiscItems"
            | "EmailItems"
        >,
        number | object[]
    >;

export interface IAffiliationMods {
    Tag: string;
    Standing?: number;
    Title?: number;
}

export interface IPurchaseResponse {
    InventoryChanges: IInventoryChanges;
    Standing?: IAffiliationMods[];
    FreeFavorsUsed?: IAffiliationMods[];
    BoosterPackItems?: string;
}

export type IBinChanges = {
    count?: number;
    platinum?: number;
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

export const slotNames = [
    "SuitBin",
    "WeaponBin",
    "MechBin",
    "PveBonusLoadoutBin",
    "SentinelBin",
    "SpaceSuitBin",
    "SpaceWeaponBin",
    "OperatorAmpBin",
    "RandomModBin",
    "CrewShipSalvageBin",
    "CrewMemberBin"
] as const;

export type SlotNames = (typeof slotNames)[number];

export type SlotPurchase = {
    [P in SlotPurchaseName]: { name: SlotNames; purchaseQuantity: number };
};
