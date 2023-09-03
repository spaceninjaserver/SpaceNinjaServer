import { IOid } from "./commonTypes";
import { IDate } from "./inventoryTypes/inventoryTypes";

export interface IMissionInventoryUpdateGear {
    ItemType: string;
    ItemName: string;
    ItemId: IOid;
    XP: number;
    UpgradeVer: number;
    Features: number;
    Polarized: number;
    CustomizationSlotPurchases: number;
    ModSlotPurchases: number;
    FocusLens: string;
    Expiry: IDate;
    Polarity: any[];
    Configs: any[];
    ModularParts: any[];
    SkillTree: string;
    UpgradeType: string;
    UpgradeFingerprint: string;
    OffensiveUpgrade: string;
    DefensiveUpgrade: string;
    UpgradesExpiry: IDate;
    ArchonCrystalUpgrades: any[];
}

export interface IMissionInventoryUpdateItem {
    ItemCount: number;
    ItemType: string;
}

export interface IMissionInventoryUpdateCard extends IMissionInventoryUpdateItem {
    ItemId: IOid;
    UpgradeFingerprint: string;
    PendingRerollFingerprint: string;
    LastAdded: IOid;
}

export interface IMissionInventoryUpdateChallange {
    Name: string;
    Progress: number;
    Completed: any[];
}

export interface IMissionInventoryUpdate {
    rewardsMultiplier?: number;
    ActiveBoosters?: any[];
    LongGuns?: IMissionInventoryUpdateGear[];
    Pistols?: IMissionInventoryUpdateGear[];
    Suits?: IMissionInventoryUpdateGear[];
    Melee?: IMissionInventoryUpdateGear[];
    RawUpgrades?: IMissionInventoryUpdateCard[];
    MiscItems?: IMissionInventoryUpdateItem[];
    RegularCredits?: number;
    ChallengeProgress?: IMissionInventoryUpdateChallange[];
}
