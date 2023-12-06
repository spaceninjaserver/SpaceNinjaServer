import { ISuitDatabase } from "@/src/types/inventoryTypes/SuitTypes";
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
        Suits?: ISuitDatabase[];
        LongGuns?: IWeaponClient[];
        Pistols?: IWeaponClient[];
        Melee?: IWeaponClient[];
        PremiumCredits?: number;
        RegularCredits?: number;
        FlavourItems?: IFlavourItem[];
    };
}

export type IBinChanges = {
    count: number;
    platinum: number;
    Slots: number;
};

export enum SlotType {
    SUIT = "SuitBin",
    WEAPON = "WeaponBin"
}
