import type { IInventoryChanges } from "./purchaseTypes.ts";

export interface IGenericUpdate {
    NodeIntrosCompleted: string | string[];
    // AffiliationMods: any[];
}

export interface IUpdateNodeIntrosResponse {
    MissionRewards: [];
    InventoryChanges: IInventoryChanges;
}
