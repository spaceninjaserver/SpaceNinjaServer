import type { IMongoDate, IOid } from "./commonTypes.ts";

export interface IItemPrice {
    ItemType: string;
    ItemCount: number;
    ProductCategory: string;
}

export interface IItemManifest {
    StoreItem: string;
    ItemPrices?: IItemPrice[];
    RegularPrice?: number[];
    PremiumPrice?: number[];
    Bin: string;
    QuantityMultiplier: number;
    Expiry: IMongoDate; // Either a date in the distant future or a period in milliseconds for preprocessing.
    PurchaseQuantityLimit?: number;
    Affiliation?: string;
    MinAffiliationRank?: number;
    ReductionPerPositiveRank?: number;
    IncreasePerNegativeRank?: number;
    RotatedWeekly?: boolean;
    AllowMultipurchase: boolean;
    LocTagRandSeed?: number | bigint;
    Id: IOid;
    RegularPriceBeforeDiscount?: number[];
    ItemPricesBeforeDiscount?: IItemPrice[];
}

export interface IVendorInfo {
    _id: IOid;
    TypeName: string;
    ItemManifest: IItemManifest[];
    PropertyTextHash?: string;
    RandomSeedType?: string;
    RequiredGoalTag?: string;
    WeaponUpgradeValueAttenuationExponent?: number;
    Expiry: IMongoDate; // Either a date in the distant future or a period in milliseconds for preprocessing.
}

export interface IVendorManifest {
    VendorInfo: IVendorInfo;
}
