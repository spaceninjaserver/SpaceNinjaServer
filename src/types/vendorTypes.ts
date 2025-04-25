import { IMongoDate, IOid } from "./commonTypes";

export interface IItemPrice {
    ItemType: string | string[]; // If string[], preprocessing will use RNG to pick one for the current period.
    ItemCount: number;
    ProductCategory: string;
}

export interface IItemPricePreprocessed extends Omit<IItemPrice, "ItemType"> {
    ItemType: string;
}

export interface IItemManifest {
    StoreItem: string;
    ItemPrices?: IItemPrice[];
    RegularPrice?: number[];
    Bin: string;
    QuantityMultiplier: number;
    Expiry: IMongoDate; // Either a date in the distant future or a period in milliseconds for preprocessing.
    PurchaseQuantityLimit?: number;
    RotatedWeekly?: boolean;
    AllowMultipurchase: boolean;
    LocTagRandSeed?: number | bigint;
    Id: IOid;
}

export interface IItemManifestPreprocessed extends Omit<IItemManifest, "ItemPrices"> {
    ItemPrices?: IItemPricePreprocessed[];
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

export interface IVendorInfoPreprocessed extends Omit<IVendorInfo, "ItemManifest"> {
    ItemManifest: IItemManifestPreprocessed[];
}

export interface IRawVendorManifest {
    VendorInfo: IVendorInfo;
}

export interface IVendorManifestPreprocessed {
    VendorInfo: IVendorInfoPreprocessed;
}
