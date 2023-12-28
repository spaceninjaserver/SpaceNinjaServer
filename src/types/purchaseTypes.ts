import { slotPurchaseNameToSlotName } from "@/src/services/purchaseService";
import { ISuitClient } from "@/src/types/inventoryTypes/SuitTypes";
import { IFlavourItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { IWeaponClient } from "@/src/types/inventoryTypes/weaponTypes";

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
        MechSuits?: ISuitClient[];
        Suits?: ISuitClient[];
        LongGuns?: IWeaponClient[];
        Pistols?: IWeaponClient[];
        Melee?: IWeaponClient[];
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

export enum SlotNameToInventoryName {
    SUIT = "SuitBin",
    WEAPON = "WeaponBin",
    MECHSUIT = "MechBin",
    LOADOUT = "PveBonusLoadoutBin",
    SENTINEL = "SentinelBin"
}

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
