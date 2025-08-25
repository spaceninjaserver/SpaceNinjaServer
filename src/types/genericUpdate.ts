import type { IInventoryChanges } from "@/src/types/purchaseTypes";

export interface IGenericUpdate {
    NodeIntrosCompleted: string | string[];
    // AffiliationMods: any[];
}

export interface IUpdateNodeIntrosResponse {
    MissionRewards: [];
    InventoryChanges: IInventoryChanges;
}
