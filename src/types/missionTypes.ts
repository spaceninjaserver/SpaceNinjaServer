import { IAffiliationMods, IInventoryChanges } from "./purchaseTypes";

export const inventoryFields = ["RawUpgrades", "MiscItems", "Consumables", "Recipes"] as const;
export type IInventoryFieldType = (typeof inventoryFields)[number];

export interface IMissionReward {
    StoreItem: string;
    TypeName?: string;
    UpgradeLevel?: number;
    ItemCount: number;
    TweetText?: string;
    ProductCategory?: string;
    FromEnemyCache?: boolean;
    IsStrippedItem?: boolean;
}

export interface IMissionCredits {
    MissionCredits: number[];
    CreditBonus: number[];
    TotalCredits: number[];
    DailyMissionBonus?: boolean;
}

export interface IMissionInventoryUpdateResponse extends Partial<IMissionCredits> {
    ConquestCompletedMissionsCount?: number;
    InventoryJson?: string;
    MissionRewards?: IMissionReward[];
    InventoryChanges?: IInventoryChanges;
    FusionPoints?: number;
    SyndicateXPItemReward?: number;
    AffiliationMods?: IAffiliationMods[];
}
