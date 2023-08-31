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

export interface MissionInventoryUpdateCard extends MissionInventoryUpdateItem {
    ItemId: MongooseId;
    UpgradeFingerprint: string;
    PendingRerollFingerprint: string;
    LastAdded: MongooseId;
}

interface MissionInventoryUpdateChallange {
    Name: string;
    Progress: number;
    Completed: any[];
}

export interface MissionInventoryUpdate {
    rewardsMultiplier?: number;
    ActiveBoosters?: any[];
    LongGuns?: MissionInventoryUpdateGear[];
    Pistols?: MissionInventoryUpdateGear[];
    Suits?: MissionInventoryUpdateGear[];
    Melee?: MissionInventoryUpdateGear[];
    RawUpgrades?: MissionInventoryUpdateCard[];
    MiscItems?: MissionInventoryUpdateItem[];
    RegularCredits?: number;
    ChallengeProgress?: MissionInventoryUpdateChallange[];
}