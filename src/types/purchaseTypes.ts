import type { TFocusSchool } from "warframe-public-export-plus";
import type { IOid } from "./commonTypes.ts";
import type {
    IRecentVendorPurchaseClient,
    TInventorySlot,
    IInventoryClient,
    INemesisClient
} from "./inventoryTypes/inventoryTypes.ts";

export const ePurchaseSource = {
    Market: 0, // platinum, from metadata
    VoidTrader: 1, // ducat + credits
    SyndicateFavor: 2, // standing
    DailyDeal: 3, // platinum, from server
    Arsenal: 4, // platinum, from metadata
    Profile: 5, // ???
    Hub: 6, // ???
    Vendor: 7, // variable, from manifest
    AppearancePreview: 8, // platinum?
    Museum: 9, // credits
    Operator: 10, // ???
    PlayerShip: 11, // ???
    Crewship: 12, // ???
    MenuStyle: 13, // platinum?
    MenuHud: 14, // platinum?
    Chat: 15, // ???
    Inventory: 16, // ???
    StarChart: 17, // ???
    PrimeVaultTrader: 18, // aya + regal aya, from server
    Incubator: 19, // ???
    Prompt: 20, // ???
    Kaithe: 21, // ???
    DuviriWeapon: 22, // ???
    UpdateScreen: 23, // ???
    Motorcycle: 24 // ???
} as const;
type TPurchaseSource = (typeof ePurchaseSource)[keyof typeof ePurchaseSource];

export interface IPurchaseRequest {
    PurchaseParams: IPurchaseParams;
    buildLabel: string;
}

export interface IPurchaseRequestU16 {
    productName: string;
    quantity: number;
    usePremium: "1" | "0";
    voidTraderId?: string;
}

export interface IPurchaseParams {
    Source: TPurchaseSource;
    SourceId?: string; // VoidTrader, Vendor, PrimeVaultTrader
    StoreItem: string;
    StorePage?: string;
    SearchTerm?: string;
    CurrentLocation?: string;
    Quantity: number;
    UsePremium: boolean;
    ExpectedPrice?: number;
    Durability?: number;
    SyndicateTag?: string; // SyndicateFavor
    UseFreeFavor?: boolean; // SyndicateFavor
    ExtraPurchaseInfoJson?: string; // Vendor
    IsWeekly?: boolean; // Vendor
}

export type IInventoryChanges = Partial<
    Omit<IInventoryClient, TInventorySlot | "Nemesis" | "RecentVendorPurchases">
> & {
    [_ in TInventorySlot]?: IBinChanges;
} & {
    Nemesis?: Partial<INemesisClient>;
    RemovedIdItems?: { ItemId: IOid }[];
    NewVendorPurchase?: IRecentVendorPurchaseClient; // >= 38.5.0
    RecentVendorPurchases?: IRecentVendorPurchaseClient; // < 38.5.0
};

export interface IAffiliationMods {
    Tag: string;
    Standing?: number;
    Title?: number;
}

export interface IPurchaseResponse {
    InventoryChanges: IInventoryChanges;
    Standing?: IAffiliationMods[];
    FreeFavorsUsed?: IAffiliationMods[];
    BoosterPackItems?: string;
    Body?: string;
    DailyDealUsed?: string;
    FocusCost?: { Polarity: TFocusSchool; Cost: number };
}

export type IBinChanges = {
    count?: number;
    platinum?: number;
    Slots: number;
    Extra?: number;
};
