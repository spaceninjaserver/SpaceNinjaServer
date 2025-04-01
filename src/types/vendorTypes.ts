import { IMongoDate, IOid } from "./commonTypes";

interface IItemPrice {
    ItemType: string | string[]; // If string[], preprocessing will use RNG to pick one for the current period.
    ItemCount: number;
    ProductCategory: string;
}

interface IItemPricePreprocessed extends Omit<IItemPrice, "ItemType"> {
    ItemType: string;
}

interface IItemManifest {
    StoreItem: string;
    ItemPrices?: IItemPrice[];
    Bin: string;
    QuantityMultiplier: number;
    Expiry: IMongoDate; // Either a date in the distant future or a period in milliseconds for preprocessing.
    PurchaseQuantityLimit?: number;
    RotatedWeekly?: boolean;
    AllowMultipurchase: boolean;
    LocTagRandSeed?: number | bigint;
    Id: IOid;
}

interface IItemManifestPreprocessed extends Omit<IItemManifest, "ItemPrices"> {
    ItemPrices?: IItemPricePreprocessed[];
}

interface IVendorInfo {
    _id: IOid;
    TypeName: string;
    ItemManifest: IItemManifest[];
    Expiry: IMongoDate; // Either a date in the distant future or a period in milliseconds for preprocessing.
}

interface IVendorInfoPreprocessed extends Omit<IVendorInfo, "ItemManifest"> {
    ItemManifest: IItemManifestPreprocessed[];
}

export interface IVendorManifest {
    VendorInfo: IVendorInfo;
}

export interface IVendorManifestPreprocessed {
    VendorInfo: IVendorInfoPreprocessed;
}
