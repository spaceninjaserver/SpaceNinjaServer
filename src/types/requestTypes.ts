import type { IOid, IOidWithLegacySupport, ITypeCount } from "./commonTypes.ts";
import type { ArtifactPolarity, IPolarity } from "./inventoryTypes/commonInventoryTypes.ts";
import type {
    IBooster,
    IChallengeProgress,
    IEvolutionProgress,
    IMission,
    IRawUpgrade,
    ISeasonChallenge,
    TSolarMapRegion,
    TEquipmentKey,
    IFusionTreasure,
    ICustomMarkers,
    IPlayerSkills,
    IQuestKeyDatabase,
    ILoreFragmentScan,
    IUpgradeFromClient,
    ICollectibleEntry,
    IDiscoveredMarker,
    ILockedWeaponGroupClient,
    IInvasionProgressClient,
    IWeaponSkinClient,
    IKubrowPetEggClient,
    INemesisClient,
    IUpgradeClient,
    IChallengeInstanceStateClient
} from "./inventoryTypes/inventoryTypes.ts";
import type { IGroup } from "./loginTypes.ts";
import type { ILoadOutPresets } from "./saveLoadoutTypes.ts";
import type { IEquipmentClient } from "./equipmentTypes.ts";
import type { TMissionType } from "warframe-public-export-plus";

export interface IAffiliationChange {
    Tag: string;
    Standing: number;
    Title: number;
}

export type IMissionInventoryUpdateRequest = {
    MiscItems?: ITypeCount[];
    Recipes?: ITypeCount[];
    FusionBundles?: ITypeCount[];
    Consumables?: ITypeCount[];
    FusionBundels?: ITypeCount[];
    CrewShipRawSalvage?: ITypeCount[];
    CrewShipAmmo?: ITypeCount[];
    BonusMiscItems?: ITypeCount[];
    EmailItems?: ITypeCount[];
    ShipDecorations?: ITypeCount[];

    // flags for interstitial requests
    BMI?: boolean;
    TNT?: boolean; // Conservation; definitely need to include AffiliationMods in this case, so a normal 'inventory sync' would not work here.
    SSC?: boolean; // K-Drive race?
    RJ?: boolean; // Railjack. InventoryJson should only be returned when going back to dojo.
    SS?: boolean;
    CMI?: boolean;
    EJC?: boolean;

    SyndicateId?: string;
    SortieId?: string;
    CalendarProgress?: { challenge: string }[];
    SeasonChallengeCompletions?: ISeasonChallenge[];
    AffiliationChanges?: IAffiliationChange[];
    crossPlaySetting?: string;
    rewardsMultiplier?: number;
    GoalTag?: string;
    LevelKeyName: string;
    KeyOwner?: string;
    KeyRemovalHash?: string;
    KeyToRemove?: string;
    ActiveBoosters?: IBooster[];
    RawUpgrades?: IRawUpgrade[];
    FusionTreasures?: IFusionTreasure[];
    QuestKeys?: Omit<IQuestKeyDatabase, "CompletionDate">[];
    RegularCredits?: number;
    MissionFailed: boolean;
    MissionStatus?: IMissionStatus;
    AliveTime: number;
    MissionTime: number;
    Missions?: IMission;
    Alerts?: IMission;
    LastRegionPlayed?: TSolarMapRegion;
    GameModeId: number;
    hosts: string[];
    currentClients: unknown[];
    ChallengeProgress: IChallengeProgress[];
    PS: string;
    ActiveDojoColorResearch: string;
    RewardInfo?: IRewardInfo;
    NemesisKillConvert?: {
        nemesisName: string;
        weaponLoc: string;
        petLoc: "" | "/Lotus/Language/Pets/ZanukaPetName";
        fingerprint: bigint | number;
        killed: boolean;
    };
    target?: INemesisClient;
    ReceivedCeremonyMsg: boolean;
    LastCeremonyResetDate: number;
    MissionPTS: number;
    RepHash: string;
    EndOfMatchUpload: boolean;
    ObjectiveReached: boolean;
    sharedSessionId: string;
    FpsAvg: number;
    FpsMin: number;
    FpsMax: number;
    FpsSamples: number;
    EvolutionProgress?: IEvolutionProgress[];
    FocusXpIncreases?: number[];
    PlayerSkillGains: Partial<IPlayerSkills>;
    CustomMarkers?: ICustomMarkers[];
    LoreFragmentScans?: ILoreFragmentScan[];
    VoidTearParticipantsCurrWave?: {
        Wave: number;
        IsFinalWave: boolean;
        Participants: IVoidTearParticipantInfo[];
    };
    LibraryScans?: {
        EnemyType: string;
        Count: number;
        CodexScanCount: number;
        Standing: number;
    }[];
    CollectibleScans?: ICollectibleEntry[];
    Upgrades?: IUpgradeFromClient[]; // riven challenge progress
    WeaponSkins?: IWeaponSkinClient[];
    StrippedItems?: {
        DropTable: string;
        DROP_MOD?: number[];
        DROP_BLUEPRINT?: number[];
        DROP_MISC_ITEM?: number[];
    }[];
    DeathMarks?: string[];
    Nemesis?: number;
    Boosters?: IBooster[];
    CapturedAnimals?: {
        AnimalType: string;
        CaptureRating: number;
        NumTags: number;
        NumExtraRewards: number;
        Count: number;
    }[];
    KubrowPetEggs?: IKubrowPetEggClient[];
    DiscoveredMarkers?: IDiscoveredMarker[];
    BrandedSuits?: IOid; // sent when captured by g3
    LockedWeaponGroup?: ILockedWeaponGroupClient; // sent when captured by zanuka
    UnlockWeapons?: boolean; // sent when recovered weapons from zanuka capture
    IncHarvester?: boolean; // sent when recovered weapons from zanuka capture
    CurrentLoadOutIds?: {
        LoadOuts?: ILoadOutPresets; // sent when recovered weapons from zanuka capture
    };
    wagerTier?: number; // the index
    creditsFee?: number; // the index
    GoalProgress?: {
        _id: IOid;
        Count: number;
        Best: number;
        Tag: string;
        IsMultiProgress: boolean;
        MultiProgress: unknown[];
    }[];
    InvasionProgress?: IInvasionProgressClient[];
    ConquestMissionsCompleted?: number;
    duviriSuitSelection?: string;
    duviriPistolSelection?: string;
    duviriLongGunSelection?: string;
    duviriMeleeSelection?: string;
    duviriCaveOffers?: {
        Seed: number | bigint;
        Warframes: string[];
        Weapons: string[];
    };
    ChallengeInstanceStates?: IChallengeInstanceStateClient[];
} & {
    [K in TEquipmentKey]?: IEquipmentClient[];
};

export interface IBountyRewardInfo {
    node: string;
    EOM_AFK?: number;
    JobTier?: number;
    jobId?: string;
    JobStage?: number;
    Q?: boolean; // likely indicates that the bonus objective for this stage was completed
    CheckpointCounter?: number; // starts at 1, is incremented with each job stage upload, and does not reset when starting a new job
    challengeMissionId?: string;
    GoalProgressAmount?: number;
}

export interface IRewardInfo extends IBountyRewardInfo {
    node: string;
    goalId?: string;
    goalManifest?: string;
    invasionId?: string;
    invasionAllyFaction?: "FC_GRINEER" | "FC_CORPUS";
    alertId?: string;
    sortieId?: string;
    sortieTag?: "Mission1" | "Mission2" | "Final";
    sortiePrereqs?: string[];
    VaultsCracked?: number; // for Spy missions
    rewardTier?: number;
    nightmareMode?: boolean;
    useVaultManifest?: boolean;
    EnemyCachesFound?: number;
    toxinOk?: boolean;
    lostTargetWave?: number;
    defenseTargetCount?: number;
    NemesisAbandonedRewards?: string[];
    NemesisHenchmenKills?: number;
    NemesisHintProgress?: number;
    EOM_AFK?: number;
    rewardQualifications?: string; // did a Survival for 5 minutes and this was "1"
    rewardTierOverrides?: number[]; // Disruption
    PurgatoryRewardQualifications?: string;
    POICompletions?: number;
    LootDungeonCompletions?: number;
    rewardSeed?: number | bigint;
    periodicMissionTag?: string;
    T?: number; // Duviri
    ConquestType?: string;
    ConquestCompleted?: number;
    ConquestEquipmentSuggestionsFulfilled?: number;
    ConquestPersonalModifiersActive?: number;
    ConquestStickersActive?: number;
    ConquestHardModeActive?: number;
    EncounterEnemyLevel?: number;
    missionType?: TMissionType;
    PvpGame?: boolean;
    PvpWinner?: boolean;
    PvpVariantPrize?: boolean;
    PvpChallengeHadAffector?: boolean;
    PVPChallengeInstancesCompleted?: {
        ChallengeInstanceIDs: IOidWithLegacySupport[];
    };
}

export type IMissionStatus = "GS_SUCCESS" | "GS_FAILURE" | "GS_DUMPED" | "GS_QUIT" | "GS_INTERRUPTED";

export interface IUpgradesRequest {
    ItemCategory: TEquipmentKey;
    ItemId: IOid;
    ItemFeatures: number;
    UpgradeVersion: number;
    Operations: IUpgradeOperation[];
}
export interface IUpgradesRequestLegacy {
    Category: TEquipmentKey;
    Weapon: { ItemType: string; ItemId: IOidWithLegacySupport };
    UpgradeVer: number;
    UnlockLevel: number;
    Polarized: number;
    UtilityUnlocked: number;
    FocusLens?: string;
    UpgradeReq?: string;
    UtilityReq?: string;
    IsSwappingOperation: boolean;
    PolarizeReq?: string;
    PolarizeSlot: number;
    PolarizeValue: ArtifactPolarity;
    PolarityRemap: IPolarity[];
    UpgradesToAttach?: IUpgradeClient[];
    UpgradesToDetach?: IUpgradeClient[];
}
export interface IUpgradeOperation {
    OperationType: string;
    UpgradeRequirement: string; // uniqueName of item being consumed
    PolarizeSlot: number;
    PolarizeValue: ArtifactPolarity;
    PolarityRemap: IPolarity[];
}

export interface IVoidTearParticipantInfo {
    AccountId: string;
    Name: string;
    ChosenRewardOwner: string;
    MissionHash: string;
    VoidProjection: string;
    Reward: string;
    QualifiesForReward: boolean;
    HaveRewardResponse: boolean;
    RewardsMultiplier: number;
    RewardProjection: string;
    HardModeReward: ITypeCount;
}

export interface IKeyChainRequest {
    KeyChain: string;
    ChainStage: number;
    Groups?: IGroup[];
}
