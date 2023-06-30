import { Oid } from "@/src/types/commonTypes";
import { Color, Polarity } from "@/src/types/inventoryTypes/commonInventoryTypes";

export interface IWeaponResponse extends IWeaponDatabase {
    ItemId: Oid;
}

export interface IWeaponDatabase {
    ItemType: string;
    Configs: WeaponConfig[];
    UpgradeVer?: number;
    XP?: number;
    Features?: number;
    Polarized?: number;
    Polarity?: Polarity[];
    FocusLens?: string;
    ModSlotPurchases?: number;
    UpgradeType?: string;
    UpgradeFingerprint?: string;
    ItemName?: string;
    ModularParts?: string[];
    UnlockLevel?: number;
}

export interface WeaponConfig {
    Skins?: string[];
    pricol?: Color;
    Upgrades?: string[];
    attcol?: Color;
    eyecol?: OperatorLoadOutSigcol;
    Name?: string;
    PvpUpgrades?: string[];
}

export interface OperatorLoadOutSigcol {
    t0?: number;
    t1?: number;
    en?: number;
}
