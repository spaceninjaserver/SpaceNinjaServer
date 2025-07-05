import { Types } from "mongoose";
import { IMongoDate, IOid, IOidWithLegacySupport } from "@/src/types/commonTypes";
import {
    ICrewShipCustomization,
    IFlavourItem,
    IItemConfig,
    IPolarity
} from "@/src/types/inventoryTypes/commonInventoryTypes";

export interface IEquipmentSelection {
    ItemId: IOid;
    mod?: number;
    cus?: number;
    ItemType?: string;
    hide?: boolean;
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
export interface ICrewShipWeapon {
    PILOT?: ICrewShipWeaponEmplacements;
    PORT_GUNS?: ICrewShipWeaponEmplacements;
    STARBOARD_GUNS?: ICrewShipWeaponEmplacements;
    ARTILLERY?: ICrewShipWeaponEmplacements;
    SCANNER?: ICrewShipWeaponEmplacements;
}

export interface ICrewShipWeaponEmplacements {
    PRIMARY_A?: IEquipmentSelection;
    PRIMARY_B?: IEquipmentSelection;
    SECONDARY_A?: IEquipmentSelection;
    SECONDARY_B?: IEquipmentSelection;
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
