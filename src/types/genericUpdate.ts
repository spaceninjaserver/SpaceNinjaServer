import { IInventoryChanges } from "./purchaseTypes";

export interface IGenericUpdate {
    NodeIntrosCompleted: string | string[];
    // AffiliationMods: any[];
}

export interface IUpdateNodeIntrosResponse {
    MissionRewards: [];
    InventoryChanges: IInventoryChanges;
}
