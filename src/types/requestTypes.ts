import { IOid } from "./commonTypes";
import { IPolarity, FocusSchool, IEquipmentClient } from "@/src/types/inventoryTypes/commonInventoryTypes";
import {
    IBooster,
    IChallengeProgress,
    IConsumable,
    ICrewShipSalvagedWeaponSkin,
    IEvolutionProgress,
    IMiscItem,
    IMission,
    IRawUpgrade,
    ISeasonChallenge
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
    LongGuns?: IEquipmentClient[];
    Pistols?: IEquipmentClient[];
    Suits?: IEquipmentClient[];
    Melee?: IEquipmentClient[];
    RawUpgrades?: IRawUpgrade[];
    MiscItems?: IMiscItem[];
    Consumables?: IConsumable[];
    Recipes?: IConsumable[];
    RegularCredits?: number;
    ChallengeProgress?: IChallengeProgress[];
    RewardInfo?: IMissionInventoryUpdateRequestRewardInfo;
    FusionPoints?: number;
    Missions?: IMission;
    EvolutionProgress?: IEvolutionProgress[];
}

export interface IMissionInventoryUpdateRequestRewardInfo {
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

export interface IInventorySlotsRequest {
    Bin: "PveBonusLoadoutBin";
}

export interface IUpdateGlyphRequest {
    AvatarImageType: string;
    AvatarImage: string;
}

export interface IUpgradesRequest {
    ItemCategory: string;
    ItemId: IOid;
    ItemFeatures: number;
    UpgradeVersion: number;
    Operations: IUpgradeOperation[];
}

export interface IUpgradeOperation {
    OperationType: string;
    UpgradeRequirement: string; // uniqueName of item being consumed
    PolarizeSlot: number;
    PolarizeValue: FocusSchool;
    PolarityRemap: IPolarity[];
}
