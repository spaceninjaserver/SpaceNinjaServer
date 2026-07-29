import type { IMongoDate, IOid } from "./commonTypes.ts";

interface IItemPrice {
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
    RotatedWeekly?: boolean;
    Affiliation?: string;
    MinAffiliationRank?: number;
    ReductionPerPositiveRank?: number;
    IncreasePerNegativeRank?: number;
    StandingCost?: number;
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

interface ICachedVendorInfo extends Omit<IVendorInfo, "IItemPrice" | "ItemManifest" | "ItemPricesBeforeDiscount"> {
    ItemPrices?: readonly IItemPrice[];
    ItemManifest: readonly IItemManifest[];
    ItemPricesBeforeDiscount?: readonly IItemPrice[];
}

export interface ICachedVendorManifest {
    VendorInfo: ICachedVendorInfo;
}
