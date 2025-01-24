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
    IQuestKeyClient
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
    AffiliationChanges?: IAffiliationChange[];
    crossPlaySetting?: string;
    rewardsMultiplier?: number;
    GoalTag: string;
    LevelKeyName: string;
    ActiveBoosters?: IBooster[];
    FusionBundles?: ITypeCount[];
    RawUpgrades?: IRawUpgrade[];
    MiscItems?: ITypeCount[];
    Consumables?: ITypeCount[];
    FusionTreasures?: IFusionTreasure[];
    Recipes?: ITypeCount[];
    QuestKeys?: IQuestKeyClient[];
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
    EOM_AFK?: number;
    rewardQualifications?: string; // did a Survival for 5 minutes and this was "1"
    PurgatoryRewardQualifications?: string;
    rewardSeed?: number;
}

export type IMissionStatus = "GS_SUCCESS" | "GS_FAILURE" | "GS_DUMPED" | "GS_QUIT" | "GS_INTERRUPTED";

export interface IInventorySlotsRequest {
    Bin: "PveBonusLoadoutBin";
}
export interface IUpdateGlyphRequest {
    AvatarImageType: string;
    AvatarImage: string;
}
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
