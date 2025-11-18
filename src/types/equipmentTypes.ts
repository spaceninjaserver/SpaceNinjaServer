import type { Types } from "mongoose";
import type { IMongoDate, IOid, IOidWithLegacySupport } from "./commonTypes.ts";
import type {
    ICrewShipCustomization,
    IFlavourItem,
    IItemConfig,
    IItemConfigDatabase,
    IPolarity
} from "./inventoryTypes/commonInventoryTypes.ts";

export interface IEquipmentSelectionClient {
    ItemId?: IOid;
    mod?: number;
    cus?: number;
    ItemType?: string;
    hide?: boolean;
}

export interface IEquipmentSelectionDatabase extends Omit<IEquipmentSelectionClient, "ItemId"> {
    ItemId?: Types.ObjectId | IOid; // should be Types.ObjectId but might be IOid because of old commits
}

export enum EquipmentFeatures {
    DOUBLE_CAPACITY = 1,
    UTILITY_SLOT = 2,
    GRAVIMAG_INSTALLED = 4,
    GILDED = 8,
    ARCANE_SLOT = 32,
    SECOND_ARCANE_SLOT = 64,
    INCARNON_GENESIS = 512,
    VALENCE_SWAP = 1024
}

export interface IEquipmentDatabase {
    ItemType: string;
    ItemName?: string;
    Configs: IItemConfigDatabase[];
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
    Expiry?: Date;
    SkillTree?: string;
    OffensiveUpgrade?: string;
    DefensiveUpgrade?: string;
    UpgradesExpiry?: Date;
    UmbraDate?: Date; // related to scrapped "echoes of umbra" feature
    ArchonCrystalUpgrades?: IArchonCrystalUpgrade[];
    Weapon?: ICrewShipWeaponDatabase;
    Customization?: ICrewShipCustomization;
    RailjackImage?: IFlavourItem;
    CrewMembers?: ICrewShipMembersDatabase;
    Details?: IKubrowPetDetailsDatabase;
    Favorite?: boolean;
    IsNew?: boolean;
    _id: Types.ObjectId;
}

export interface IEquipmentClient
    extends Omit<
        IEquipmentDatabase,
        | "_id"
        | "Configs"
        | "InfestationDate"
        | "Expiry"
        | "UpgradesExpiry"
        | "UmbraDate"
        | "Weapon"
        | "CrewMembers"
        | "Details"
    > {
    ItemId: IOidWithLegacySupport;
    Configs: IItemConfig[];
    InfestationDate?: IMongoDate;
    Expiry?: IMongoDate;
    UpgradesExpiry?: IMongoDate;
    UmbraDate?: IMongoDate;
    Weapon?: ICrewShipWeaponClient;
    CrewMembers?: ICrewShipMembersClient;
    Details?: IKubrowPetDetailsClient;
    // For Pre-U24.4.0 builds
    UnlockLevel?: number;
    UtilityUnlocked?: number;
    Gild?: boolean;
}

export interface IArchonCrystalUpgrade {
    UpgradeType?: string;
    Color?: string;
}

export interface ITraits {
    BaseColor: string;
    SecondaryColor: string;
    TertiaryColor: string;
    AccentColor: string;
    EyeColor: string;
    FurPattern: string;
    Personality: string;
    BodyType: string;
    Head?: string;
    Tail?: string;
}

export interface IKubrowPetDetailsDatabase {
    Name?: string;
    IsPuppy?: boolean;
    HasCollar: boolean;
    PrintsRemaining: number;
    Status: Status;
    HatchDate?: Date;
    DominantTraits: ITraits;
    RecessiveTraits: ITraits;
    IsMale: boolean;
    Size: number;
}

export interface IKubrowPetDetailsClient extends Omit<IKubrowPetDetailsDatabase, "HatchDate"> {
    HatchDate: IMongoDate;
}

export enum Status {
    StatusAvailable = "STATUS_AVAILABLE",
    StatusStasis = "STATUS_STASIS",
    StatusIncubating = "STATUS_INCUBATING"
}

// inventory.CrewShips[0].Weapon
export interface ICrewShipWeaponClient {
    PILOT?: ICrewShipWeaponEmplacementsClient;
    PORT_GUNS?: ICrewShipWeaponEmplacementsClient;
    STARBOARD_GUNS?: ICrewShipWeaponEmplacementsClient;
    ARTILLERY?: ICrewShipWeaponEmplacementsClient;
    SCANNER?: ICrewShipWeaponEmplacementsClient;
}

export interface ICrewShipWeaponDatabase {
    PILOT?: ICrewShipWeaponEmplacementsDatabase;
    PORT_GUNS?: ICrewShipWeaponEmplacementsDatabase;
    STARBOARD_GUNS?: ICrewShipWeaponEmplacementsDatabase;
    ARTILLERY?: ICrewShipWeaponEmplacementsDatabase;
    SCANNER?: ICrewShipWeaponEmplacementsDatabase;
}

export interface ICrewShipWeaponEmplacementsClient {
    PRIMARY_A?: IEquipmentSelectionClient;
    PRIMARY_B?: IEquipmentSelectionClient;
    SECONDARY_A?: IEquipmentSelectionClient;
    SECONDARY_B?: IEquipmentSelectionClient;
}

export interface ICrewShipWeaponEmplacementsDatabase {
    PRIMARY_A?: IEquipmentSelectionDatabase;
    PRIMARY_B?: IEquipmentSelectionDatabase;
    SECONDARY_A?: IEquipmentSelectionDatabase;
    SECONDARY_B?: IEquipmentSelectionDatabase;
}

export interface ICrewShipMembersClient {
    SLOT_A?: ICrewShipMemberClient;
    SLOT_B?: ICrewShipMemberClient;
    SLOT_C?: ICrewShipMemberClient;
}

export interface ICrewShipMembersDatabase {
    SLOT_A?: ICrewShipMemberDatabase;
    SLOT_B?: ICrewShipMemberDatabase;
    SLOT_C?: ICrewShipMemberDatabase;
}

export interface ICrewShipMemberClient {
    ItemId?: IOid;
    NemesisFingerprint?: number | bigint;
}

export interface ICrewShipMemberDatabase {
    ItemId?: Types.ObjectId;
    NemesisFingerprint?: bigint;
}
