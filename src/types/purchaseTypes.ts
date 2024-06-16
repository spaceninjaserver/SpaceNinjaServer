import { IFlavourItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { IEquipmentClient } from "./inventoryTypes/commonInventoryTypes";

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

export interface IPurchaseResponse {
    InventoryChanges: {
        SuitBin?: IBinChanges;
        WeaponBin?: IBinChanges;
        MechBin?: IBinChanges;
        MechSuits?: IEquipmentClient[];
        Suits?: IEquipmentClient[];
        LongGuns?: IEquipmentClient[];
        Pistols?: IEquipmentClient[];
        Melee?: IEquipmentClient[];
        PremiumCredits?: number;
        PremiumCreditsFree?: number;
        RegularCredits?: number;
        FlavourItems?: IFlavourItem[];
    };
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
