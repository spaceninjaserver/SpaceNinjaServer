/* eslint-disable @typescript-eslint/no-explicit-any */
interface MongooseId {
    $oid: string;
}

interface ExpireDate {
    $date: {
        $numberLong: string;
    };
}

export interface MissionInventoryUpdateGear {
    ItemType: string;
    ItemName: string;
    ItemId: MongooseId;
    XP: number;
    UpgradeVer: number;
    Features: number;
    Polarized: number;
    CustomizationSlotPurchases: number;
    ModSlotPurchases: number;
    FocusLens: string;
    Expiry: ExpireDate;
    Polarity: any[];
    Configs: any[];
    ModularParts: any[];
    SkillTree: string;
    UpgradeType: string;
    UpgradeFingerprint: string;
    OffensiveUpgrade: string;
    DefensiveUpgrade: string;
    UpgradesExpiry: ExpireDate;
    ArchonCrystalUpgrades: any[];
}

export interface MissionInventoryUpdateItem {
    ItemCount: number;
    ItemType: string;
}

interface MissionInventoryUpdateChallange {
    Name: string;
    Progress: number;
    Completed: any[];
}

export interface MissionInventoryUpdateRewardInfo {
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

export interface MissionInventoryUpdate {
    rewardsMultiplier?: number;
    ActiveBoosters?: any[];
    LongGuns?: MissionInventoryUpdateGear[];
    Pistols?: MissionInventoryUpdateGear[];
    Suits?: MissionInventoryUpdateGear[];
    Melee?: MissionInventoryUpdateGear[];
    RawUpgrades?: MissionInventoryUpdateItem[];
    MiscItems?: MissionInventoryUpdateItem[];
    RegularCredits?: number;
    ChallengeProgress?: MissionInventoryUpdateChallange[];
    RewardInfo?: MissionInventoryUpdateRewardInfo;
    FusionPoints?: number;
}

export interface MissionRewardResponse {
    StoreItem?: string;
    TypeName: string;
    UpgradeLevel: number;
    ItemCount: number;
    TweetText: string;
    ProductCategory: string;
}

export interface Reward {
    name: string;
    chance: number;
    rotation?: string;
}
