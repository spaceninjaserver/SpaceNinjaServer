import { IAffiliationMods, IInventoryChanges } from "@/src/types/purchaseTypes";

export const inventoryFields = ["RawUpgrades", "MiscItems", "Consumables", "Recipes"] as const;
export type IInventoryFieldType = (typeof inventoryFields)[number];

export interface IMissionReward {
    StoreItem: string;
    TypeName?: string;
    UpgradeLevel?: number;
    ItemCount: number;
    DailyCooldown?: boolean;
    Rarity?: number;
    TweetText?: string;
    ProductCategory?: string;
    FromEnemyCache?: boolean;
    IsStrippedItem?: boolean;
}

export interface IMissionCredits {
    MissionCredits: [number, number];
    CreditsBonus: [number, number]; // "Credit Reward"; `CreditsBonus[1]` is `CreditsBonus[0] * 2` if DailyMissionBonus
    TotalCredits: [number, number];
    DailyMissionBonus?: boolean;
}

export interface IMissionInventoryUpdateResponseRailjackInterstitial extends Partial<IMissionCredits> {
    ConquestCompletedMissionsCount?: number;
    MissionRewards?: IMissionReward[];
    InventoryChanges?: IInventoryChanges;
    FusionPoints?: number;
    SyndicateXPItemReward?: number;
    AffiliationMods?: IAffiliationMods[];
}

export interface IMissionInventoryUpdateResponse extends IMissionInventoryUpdateResponseRailjackInterstitial {
    InventoryJson?: string;
}

export interface IMissionInventoryUpdateResponseBackToDryDock {
    InventoryJson: string;
}
