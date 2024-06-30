import { IOid } from "./commonTypes";
import { ArtifactPolarity, IPolarity, IEquipmentClient } from "@/src/types/inventoryTypes/commonInventoryTypes";
import {
    IBooster,
    IChallengeProgress,
    IConsumable,
    ICrewShipSalvagedWeaponSkin,
    IEvolutionProgress,
    IMiscItem,
    ITypeCount,
    IMission,
    IRawUpgrade,
    ISeasonChallenge,
    TSolarMapRegion,
    TEquipmentKey
} from "./inventoryTypes/inventoryTypes";

export interface IArtifactsRequest {
    Upgrade: ICrewShipSalvagedWeaponSkin;
    LevelDiff: number;
    Cost: number;
    FusionPointCost: number;
}

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

export interface IMissionInventoryUpdateRequest {
    rewardsMultiplier?: number;
    ActiveBoosters?: IBooster[];
    AffiliationChanges?: IAffiliationChange[];
    Suits?: IEquipmentClient[];
    LongGuns?: IEquipmentClient[];
    Pistols?: IEquipmentClient[];
    Melee?: IEquipmentClient[];
    SpecialItems?: IEquipmentClient[];
    Sentinels?: IEquipmentClient[];
    SentinelWeapons?: IEquipmentClient[];
    SpaceSuits?: IEquipmentClient[];
    SpaceGuns?: IEquipmentClient[];
    SpaceMelee?: IEquipmentClient[];
    Hoverboards?: IEquipmentClient[];
    OperatorAmps?: IEquipmentClient[];
    MoaPets?: IEquipmentClient[];
    FusionBundles?: ITypeCount[];
    RawUpgrades?: IRawUpgrade[];
    MiscItems?: IMiscItem[];
    Consumables?: IConsumable[];
    Recipes?: IConsumable[];
    RegularCredits?: number;
    ChallengeProgress?: IChallengeProgress[];
    RewardInfo?: IMissionInventoryUpdateRequestRewardInfo;
    Missions?: IMission;
    EvolutionProgress?: IEvolutionProgress[];
    LastRegionPlayed?: TSolarMapRegion;

    FusionPoints?: number; // Not a part of the request, but we put it in this struct as an intermediate storage.
}

export interface IMissionInventoryUpdateRequestRewardInfo {
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
