import { IOid } from "@/src/types/commonTypes";
import { IAbilityOverride, IColor, IPolarity } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { Document, Types } from "mongoose";

// export interface ISuitDocument extends ISuitResponse, Document {}
export interface ISuitDocument extends Document, ISuitResponse {
    _id: Types.ObjectId;
}

export interface ISuitResponse extends ISuitDatabase {
    ItemId: IOid;
}

export interface ISuitDatabase {
    ItemType: string;
    Configs: SuitConfig[];
    UpgradeVer?: number;
    XP?: number;
    InfestationDate?: Date;
    Features?: number;
    Polarity?: IPolarity[];
    Polarized?: number;
    ModSlotPurchases?: number;
    FocusLens?: string;
    UnlockLevel?: number;
    _id: Types.ObjectId;
}

export interface SuitConfig {
    Skins?: string[];
    pricol?: IColor;
    attcol?: IColor;
    eyecol?: IColor;
    sigcol?: IColor;
    Upgrades?: string[];
    Songs?: Song[];
    Name?: string;
    AbilityOverride?: IAbilityOverride;
    PvpUpgrades?: string[];
    ugly?: boolean;
}

export interface Song {
    m?: string;
    b?: string;
    p?: string;
    s: string;
}
