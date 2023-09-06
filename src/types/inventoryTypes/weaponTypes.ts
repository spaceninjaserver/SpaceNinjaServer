import { IOid } from "@/src/types/commonTypes";
import { IColor, IPolarity } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { Types } from "mongoose";

export interface IWeaponResponse extends IWeaponDatabase {
    ItemId: IOid;
}

export interface IWeaponDatabase {
    ItemType: string;
    Configs: WeaponConfig[];
    UpgradeVer?: number;
    XP?: number;
    Features?: number;
    Polarized?: number;
    Polarity?: IPolarity[];
    FocusLens?: string;
    ModSlotPurchases?: number;
    UpgradeType?: string;
    UpgradeFingerprint?: string;
    ItemName?: string;
    ModularParts?: string[];
    UnlockLevel?: number;
    _id?: Types.ObjectId;
}

export interface WeaponConfig {
    Skins?: string[];
    pricol?: IColor;
    Upgrades?: string[];
    attcol?: IColor;
    eyecol?: IOperatorLoadOutSigcol;
    Name?: string;
    PvpUpgrades?: string[];
}

export interface IOperatorLoadOutSigcol {
    t0?: number;
    t1?: number;
    en?: number;
}
