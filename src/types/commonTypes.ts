import { CrewShipSalvageBinClass, SuitConfig } from "./inventoryTypes";

export interface Oid {
    $oid: string;
}

export interface StoreItem {
    ItemType?: string;
    ItemId?: Oid;
    ItemCount?: number;
    Cofigs?: SuitConfig[];
}

export interface InventoryChanges {
    WeaponBin?: CrewShipSalvageBinClass;
    WishlistChanges?: string[];
    FlavourItems?: StoreItem[];
    Suits?: StoreItem[];
    LongGuns?: StoreItem[];
    Pistols?: StoreItem[];
    Melee?: StoreItem[];
    MiscItems?: StoreItem[];
    PremiumCredits?: number;
    RegularCredits?: number;
}
