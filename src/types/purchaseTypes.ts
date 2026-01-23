import type { IOid, ITypeCount } from "./commonTypes.ts";
import type { IEquipmentClient } from "./equipmentTypes.ts";
import type {
    IDroneClient,
    IInfestedFoundryClient,
    IMiscItem,
    INemesisClient,
    IRecentVendorPurchaseClient,
    TEquipmentKey,
    ICrewMemberClient,
    IKubrowPetPrintClient,
    IUpgradeClient,
    IQuestKeyClient,
    IRawUpgrade,
    IFocusUpgrade,
    IFocusLoadoutClient
} from "./inventoryTypes/inventoryTypes.ts";

export enum PurchaseSource {
    Market = 0,
    VoidTrader = 1,
    SyndicateFavor = 2,
    DailyDeal = 3,
    Arsenal = 4,
    Profile = 5,
    Hub = 6,
    Vendor = 7,
    AppearancePreview = 8,
    Museum = 9,
    Operator = 10,
    PlayerShip = 11,
    Crewship = 12,
    MenuStyle = 13,
    MenuHud = 14,
    Chat = 15,
    Inventory = 16,
    StarChart = 17,
    PrimeVaultTrader = 18,
    Incubator = 19,
    Prompt = 20,
    Kaithe = 21,
    DuviriWeapon = 22,
    UpdateScreen = 23,
    Motorcycle = 24
}

export interface IPurchaseRequest {
    PurchaseParams: IPurchaseParams;
    buildLabel: string;
}

export interface IPurchaseParams {
    Source: PurchaseSource;
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

export type IInventoryChanges = {
    [_ in SlotNames]?: IBinChanges;
} & {
    [_ in TEquipmentKey]?: IEquipmentClient[];
} & {
    RemovedIdItems?: { ItemId: IOid }[];
    RegularCredits?: number;
    PremiumCredits?: number;
    PremiumCreditsFree?: number;
    FusionPoints?: number;
    PrimeTokens?: number;
    InfestedFoundry?: IInfestedFoundryClient;
    Drones?: IDroneClient[];
    MiscItems?: IMiscItem[];
    ShipDecorations?: ITypeCount[];
    EmailItems?: ITypeCount[];
    CrewShipRawSalvage?: ITypeCount[];
    Nemesis?: Partial<INemesisClient>;
    NewVendorPurchase?: IRecentVendorPurchaseClient; // >= 38.5.0
    RecentVendorPurchases?: IRecentVendorPurchaseClient; // < 38.5.0
    CrewMembers?: ICrewMemberClient[];
    KubrowPetPrints?: IKubrowPetPrintClient[];
    RawUpgrades?: IRawUpgrade[];
    Upgrades?: IUpgradeClient[]; // TOVERIFY
    QuestKeys?: IQuestKeyClient[];
    OneTimePurchases?: string[];
    FocusUpgrades?: IFocusUpgrade[];
    FocusLoadouts?: IFocusLoadoutClient[];
} & Record<
        Exclude<
            string,
            | SlotNames
            | TEquipmentKey
            | "RegularCredits"
            | "PremiumCredits"
            | "PremiumCreditsFree"
            | "InfestedFoundry"
            | "Drones"
            | "MiscItems"
            | "EmailItems"
        >,
        number | object[]
    >;

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
}

export type IBinChanges = {
    count?: number;
    platinum?: number;
    Slots: number;
    Extra?: number;
};

export const slotNames = [
    "SuitBin",
    "WeaponBin",
    "MechBin",
    "PveBonusLoadoutBin",
    "PvpBonusLoadoutBin",
    "SentinelBin",
    "SpaceSuitBin",
    "SpaceWeaponBin",
    "OperatorAmpBin",
    "RandomModBin",
    "CrewShipSalvageBin",
    "CrewMemberBin",
    "PetBin"
] as const;

export type SlotNames = (typeof slotNames)[number];
