import { IMongoDate, IOid } from "@/src/types/commonTypes";
import { Types } from "mongoose";

export interface IPolarity {
    Slot: number;
    Value: FocusSchool;
}

export enum FocusSchool {
    ApAny = "AP_ANY",
    ApAttack = "AP_ATTACK",
    ApDefense = "AP_DEFENSE",
    ApPower = "AP_POWER",
    ApPrecept = "AP_PRECEPT",
    ApTactic = "AP_TACTIC",
    ApUmbra = "AP_UMBRA",
    ApUniversal = "AP_UNIVERSAL",
    ApWard = "AP_WARD"
}

export interface IColor {
    t0?: number;
    t1?: number;
    t2?: number;
    t3?: number;
    en?: number;
    e1?: number;
    m0?: number;
    m1?: number;
}

export interface IAbilityOverride {
    Ability: string;
    Index: number;
}

export interface ISlotsBin {
    Slots: number;
}

export interface IItemConfig {
    Skins?: string[];
    pricol?: IColor;
    attcol?: IColor;
    sigcol?: IColor;
    eyecol?: IColor;
    facial?: IColor;
    syancol?: IColor;
    cloth?: IColor;
    Upgrades?: string[];
    Name?: string;
    OperatorAmp?: IOid;
    Songs?: ISong[];
    AbilityOverride?: IAbilityOverride;
    PvpUpgrades?: string[];
    ugly?: boolean;
}

export interface ISong {
    m?: string;
    b?: string;
    p?: string;
    s: string;
}
export interface IOperatorConfigDatabase extends IItemConfig {
    _id: Types.ObjectId;
}

export interface IOperatorConfigClient extends Omit<IOperatorConfigDatabase, "_id"> {
    ItemId: IOid;
}

export interface IEquipmentSelection {
    ItemId: IOid;
    mod?: number;
    cus?: number;
    ItemType?: string;
    hide?: boolean;
}

export interface IEquipmentClient extends Omit<IEquipmentDatabase, "_id"> {
    ItemId: IOid;
}

export enum EquipmentFeatures {
    DOUBLE_CAPACITY = 1,
    UTILITY_SLOT = 2,
    ARCANE_SLOT = 32,
    INCARNON_GENESIS = 512
}

export interface IEquipmentDatabase {
    ItemType: string;
    ItemName?: string;
    Configs: IItemConfig[];
    UpgradeVer?: number;
    XP?: number;
    Features?: number;
    Polarized?: number;
    Polarity?: IPolarity[];
    FocusLens?: string;
    ModSlotPurchases?: number;
    CustomizationSlotPurchases?: number;
    UpgradeType?: string;
    UpgradeFingerprint?: string;
    InfestationDate?: IMongoDate;
    InfestationDays?: number;
    InfestationType?: string;
    ModularParts?: string[];
    UnlockLevel?: number;
    Expiry?: IMongoDate;
    SkillTree?: string;
    ArchonCrystalUpgrades?: IArchonCrystalUpgrade[];
    _id: Types.ObjectId;
}

export interface IArchonCrystalUpgrade {
    UpgradeType?: string;
    Color?: string;
}
