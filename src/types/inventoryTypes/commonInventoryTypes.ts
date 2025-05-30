import { IMongoDate, IOid, IOidWithLegacySupport } from "@/src/types/commonTypes";
import { Types } from "mongoose";
import {
    ICrewShipCustomization,
    ICrewShipMembersClient,
    ICrewShipMembersDatabase,
    ICrewShipWeapon,
    IFlavourItem,
    IKubrowPetDetailsClient,
    IKubrowPetDetailsDatabase
} from "@/src/types/inventoryTypes/inventoryTypes";

export interface IPolarity {
    Slot: number;
    Value: ArtifactPolarity;
}

export enum ArtifactPolarity {
    Any = "AP_ANY",
    Attack = "AP_ATTACK",
    Defense = "AP_DEFENSE",
    Power = "AP_POWER",
    Precept = "AP_PRECEPT",
    Tactic = "AP_TACTIC",
    Umbra = "AP_UMBRA",
    Universal = "AP_UNIVERSAL",
    Ward = "AP_WARD"
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

export interface IEquipmentClient
    extends Omit<
        IEquipmentDatabase,
        "_id" | "InfestationDate" | "Expiry" | "UpgradesExpiry" | "UmbraDate" | "CrewMembers" | "Details"
    > {
    ItemId: IOidWithLegacySupport;
    InfestationDate?: IMongoDate;
    Expiry?: IMongoDate;
    UpgradesExpiry?: IMongoDate;
    UmbraDate?: IMongoDate;
    CrewMembers?: ICrewShipMembersClient;
    Details?: IKubrowPetDetailsClient;
}

export enum EquipmentFeatures {
    DOUBLE_CAPACITY = 1,
    UTILITY_SLOT = 2,
    GRAVIMAG_INSTALLED = 4,
    GILDED = 8,
    ARCANE_SLOT = 32,
    INCARNON_GENESIS = 512,
    VALENCE_SWAP = 1024
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
    InfestationDate?: Date;
    InfestationDays?: number;
    InfestationType?: string;
    ModularParts?: string[];
    UnlockLevel?: number;
    Expiry?: Date;
    SkillTree?: string;
    OffensiveUpgrade?: string;
    DefensiveUpgrade?: string;
    UpgradesExpiry?: Date;
    UmbraDate?: Date; // related to scrapped "echoes of umbra" feature
    ArchonCrystalUpgrades?: IArchonCrystalUpgrade[];
    Weapon?: ICrewShipWeapon;
    Customization?: ICrewShipCustomization;
    RailjackImage?: IFlavourItem;
    CrewMembers?: ICrewShipMembersDatabase;
    Details?: IKubrowPetDetailsDatabase;
    Favorite?: boolean;
    IsNew?: boolean;
    _id: Types.ObjectId;
}

export interface IArchonCrystalUpgrade {
    UpgradeType?: string;
    Color?: string;
}
