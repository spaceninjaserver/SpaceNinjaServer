import { Oid } from "@/src/types/commonTypes";
import { AbilityOverride, Color, Polarity } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { Document, Types } from "mongoose";

// export interface ISuitDocument extends ISuitResponse, Document {}
export interface ISuitDocument extends Document, ISuitResponse {
    _id: Types.ObjectId;
}

export interface ISuitResponse extends ISuitDatabase {
    ItemId: Oid;
}

export interface ISuitDatabase {
    ItemType: string;
    Configs: SuitConfig[];
    UpgradeVer?: number;
    XP?: number;
    InfestationDate?: Date;
    Features?: number;
    Polarity?: Polarity[];
    Polarized?: number;
    ModSlotPurchases?: number;
    FocusLens?: string;
    UnlockLevel?: number;
    _id: Types.ObjectId;
}

export interface SuitConfig {
    Skins?: string[];
    pricol?: Color;
    attcol?: Color;
    eyecol?: Color;
    sigcol?: Color;
    Upgrades?: string[];
    Songs?: Song[];
    Name?: string;
    AbilityOverride?: AbilityOverride;
    PvpUpgrades?: string[];
    ugly?: boolean;
}

export interface Song {
    m?: string;
    b?: string;
    p?: string;
    s: string;
}
