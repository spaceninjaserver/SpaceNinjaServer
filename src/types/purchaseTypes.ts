import { IEquipmentClient } from "./inventoryTypes/commonInventoryTypes";
import { IDroneClient, IInfestedFoundryClient, TEquipmentKey } from "./inventoryTypes/inventoryTypes";

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

export interface ICurrencyChanges {
    RegularCredits?: number;
    PremiumCredits?: number;
    PremiumCreditsFree?: number;
}

export type IInventoryChanges = {
    [_ in SlotNames]?: IBinChanges;
} & {
    [_ in TEquipmentKey]?: IEquipmentClient[];
} & ICurrencyChanges & {
        InfestedFoundry?: IInfestedFoundryClient;
        Drones?: IDroneClient[];
    } & Record<string, IBinChanges | number | object[] | IInfestedFoundryClient>;

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
