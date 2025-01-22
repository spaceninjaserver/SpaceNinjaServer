export const inventoryFields = ["RawUpgrades", "MiscItems", "Consumables", "Recipes"] as const;
export type IInventoryFieldType = (typeof inventoryFields)[number];

export interface IMissionReward {
    StoreItem: string;
    TypeName?: string;
    UpgradeLevel?: number;
    ItemCount: number;
    TweetText?: string;
    ProductCategory?: string;
}
