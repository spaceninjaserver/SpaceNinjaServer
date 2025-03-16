import { IOid } from "./commonTypes";
import { ArtifactPolarity, IPolarity, IEquipmentClient } from "@/src/types/inventoryTypes/commonInventoryTypes";
import {
    IBooster,
    IChallengeProgress,
    IEvolutionProgress,
    ITypeCount,
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
    IUpgradeClient,
    ICollectibleEntry
} from "./inventoryTypes/inventoryTypes";

export interface IThemeUpdateRequest {
    Style?: string;
    Background?: string;
    Sounds?: string;
}

export interface IAffiliationChange {
    Tag: string;
    Standing: number;
    Title: number;
}

export interface IUpdateChallengeProgressRequest {
    ChallengeProgress: IChallengeProgress[];
    SeasonChallengeHistory: ISeasonChallenge[];
    SeasonChallengeCompletions: ISeasonChallenge[];
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

    SyndicateId?: string;
    SortieId?: string;
    SeasonChallengeCompletions?: ISeasonChallenge[];
    AffiliationChanges?: IAffiliationChange[];
    crossPlaySetting?: string;
    rewardsMultiplier?: number;
    GoalTag: string;
    LevelKeyName: string;
    ActiveBoosters?: IBooster[];
    RawUpgrades?: IRawUpgrade[];
    FusionTreasures?: IFusionTreasure[];
    QuestKeys?: Omit<IQuestKeyDatabase, "CompletionDate">[];
    RegularCredits?: number;
    MissionFailed: boolean;
    MissionStatus: IMissionStatus;
    AliveTime: number;
    MissionTime: number;
    Missions?: IMission;
    LastRegionPlayed?: TSolarMapRegion;
    GameModeId: number;
    hosts: string[];
    currentClients: unknown[];
    ChallengeProgress: IChallengeProgress[];
    PS: string;
    ActiveDojoColorResearch: string;
    RewardInfo?: IRewardInfo;
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
    PlayerSkillGains: IPlayerSkills;
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
    Upgrades?: IUpgradeClient[]; // riven challenge progress
    StrippedItems?: {
        DropTable: string;
        DROP_MOD: number[];
    }[];
    DeathMarks?: string[];
} & {
    [K in TEquipmentKey]?: IEquipmentClient[];
};

export interface IRewardInfo {
    node: string;
    VaultsCracked?: number; // for Spy missions
    rewardTier?: number;
    nightmareMode?: boolean;
    useVaultManifest?: boolean;
    EnemyCachesFound?: number;
    toxinOk?: boolean;
    lostTargetWave?: number;
    defenseTargetCount?: number;
    NemesisAbandonedRewards?: string[];
    EOM_AFK?: number;
    rewardQualifications?: string; // did a Survival for 5 minutes and this was "1"
    PurgatoryRewardQualifications?: string;
    rewardSeed?: number;
    periodicMissionTag?: string;
}

export type IMissionStatus = "GS_SUCCESS" | "GS_FAILURE" | "GS_DUMPED" | "GS_QUIT" | "GS_INTERRUPTED";

export interface IUpgradesRequest {
    ItemCategory: TEquipmentKey;
    ItemId: IOid;
    ItemFeatures: number;
    UpgradeVersion: number;
    Operations: IUpgradeOperation[];
}
export interface IUpgradeOperation {
    OperationType: string;
    UpgradeRequirement: string; // uniqueName of item being consumed
    PolarizeSlot: number;
    PolarizeValue: ArtifactPolarity;
    PolarityRemap: IPolarity[];
}
export interface IUnlockShipFeatureRequest {
    Feature: string;
    KeyChain: string;
    ChainStage: number;
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
