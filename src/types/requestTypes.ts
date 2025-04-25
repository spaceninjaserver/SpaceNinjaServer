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
    ICollectibleEntry,
    IDiscoveredMarker,
    ILockedWeaponGroupClient,
    ILoadOutPresets,
    IInvasionProgressClient
} from "./inventoryTypes/inventoryTypes";
import { IGroup } from "./loginTypes";

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

    SyndicateId?: string;
    SortieId?: string;
    CalendarProgress?: { challenge: string }[];
    SeasonChallengeCompletions?: ISeasonChallenge[];
    AffiliationChanges?: IAffiliationChange[];
    crossPlaySetting?: string;
    rewardsMultiplier?: number;
    GoalTag: string;
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
        DROP_MOD?: number[];
        DROP_BLUEPRINT?: number[];
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
    DiscoveredMarkers?: IDiscoveredMarker[];
    LockedWeaponGroup?: ILockedWeaponGroupClient; // sent when captured by zanuka
    UnlockWeapons?: boolean; // sent when recovered weapons from zanuka capture
    IncHarvester?: boolean; // sent when recovered weapons from zanuka capture
    CurrentLoadOutIds?: {
        LoadOuts?: ILoadOutPresets; // sent when recovered weapons from zanuka capture
    };
    wagerTier?: number; // the index
    creditsFee?: number; // the index
    InvasionProgress?: IInvasionProgressClient[];
    ConquestMissionsCompleted?: number;
} & {
    [K in TEquipmentKey]?: IEquipmentClient[];
};

export interface IRewardInfo {
    node: string;
    invasionId?: string;
    invasionAllyFaction?: "FC_GRINEER" | "FC_CORPUS";
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
    EOM_AFK?: number;
    rewardQualifications?: string; // did a Survival for 5 minutes and this was "1"
    PurgatoryRewardQualifications?: string;
    rewardSeed?: number | bigint;
    periodicMissionTag?: string;
    ConquestType?: string;
    ConquestCompleted?: number;
    ConquestEquipmentSuggestionsFulfilled?: number;
    ConquestPersonalModifiersActive?: number;
    ConquestStickersActive?: number;
    ConquestHardModeActive?: number;
    // for bounties, only EOM_AFK and node are given from above, plus:
    JobTier?: number;
    jobId?: string;
    JobStage?: number;
    Q?: boolean; // likely indicates that the bonus objective for this stage was completed
    CheckpointCounter?: number; // starts at 1, is incremented with each job stage upload, and does not reset when starting a new job
    challengeMissionId?: string;
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

export interface IKeyChainRequest {
    KeyChain: string;
    ChainStage: number;
    Groups?: IGroup[];
}
