/* eslint-disable @typescript-eslint/no-explicit-any */
import { IOid } from "./commonTypes";
import { IDate } from "./inventoryTypes/inventoryTypes";

export const inventoryFields = ["RawUpgrades", "MiscItems", "Consumables", "Recipes"] as const;
export type IInventoryFieldType = (typeof inventoryFields)[number];
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
    Recipes?: IMissionInventoryUpdateItem[];
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
