/* eslint-disable @typescript-eslint/no-explicit-any */
import { Oid } from "./commonTypes";
import { Date } from "./inventoryTypes/inventoryTypes";

export interface IMissionInventoryUpdateGear {
    ItemType: string;
    ItemName: string;
    ItemId: Oid;
    XP: number;
    UpgradeVer: number;
    Features: number;
    Polarized: number;
    CustomizationSlotPurchases: number;
    ModSlotPurchases: number;
    FocusLens: string;
    Expiry: Date;
    Polarity: any[];
    Configs: any[];
    ModularParts: any[];
    SkillTree: string;
    UpgradeType: string;
    UpgradeFingerprint: string;
    OffensiveUpgrade: string;
    DefensiveUpgrade: string;
    UpgradesExpiry: Date;
    ArchonCrystalUpgrades: any[];
}

export interface IMissionInventoryUpdateItem {
    ItemCount: number;
    ItemType: string;
}

export interface IMissionInventoryUpdateCard extends IMissionInventoryUpdateItem {
    ItemId: Oid;
    UpgradeFingerprint: string;
    PendingRerollFingerprint: string;
    LastAdded: Oid;
}

export interface IMissionInventoryUpdateChallange {
    Name: string;
    Progress: number;
    Completed: any[];
}

export interface IMissionInventoryUpdateRewardInfo {
    node: string;
    rewardTier?: number;
    nightmareMode?: boolean;
    useVaultManifest?: boolean;
    EnemyCachesFound?: number;
    toxinOk?: boolean;
    lostTargetWave?: number;
    defenseTargetCount?: number;
    EOM_AFK?: number;
    rewardQualifications?: string;
    PurgatoryRewardQualifications?: string;
    rewardSeed?: number;
}

export interface IMissionInventoryUpdate {
    rewardsMultiplier?: number;
    ActiveBoosters?: any[];
    LongGuns?: IMissionInventoryUpdateGear[];
    Pistols?: IMissionInventoryUpdateGear[];
    Suits?: IMissionInventoryUpdateGear[];
    Melee?: IMissionInventoryUpdateGear[];
    RawUpgrades?: IMissionInventoryUpdateItem[];
    MiscItems?: IMissionInventoryUpdateItem[];
    Consumables?: IMissionInventoryUpdateItem[];
    RegularCredits?: number;
    ChallengeProgress?: IMissionInventoryUpdateChallange[];
    RewardInfo?: IMissionInventoryUpdateRewardInfo;
    FusionPoints?: number;
}

export interface IMissionRewardResponse {
    StoreItem?: string;
    TypeName: string;
    UpgradeLevel?: number;
    ItemCount: number;
    TweetText: string;
    ProductCategory: string;
}

export interface IReward {
    name: string;
    chance: number;
    rotation?: string;
}
