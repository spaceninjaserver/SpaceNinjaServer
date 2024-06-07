import { IOid } from "./commonTypes";
import { IPolarity, FocusSchool } from "@/src/types/inventoryTypes/commonInventoryTypes";
import {
    IBooster,
    IChallengeProgress,
    IConsumable,
    ICrewShipSalvagedWeaponSkin,
    IMiscItem,
    IMission,
    IRawUpgrade,
    ISeasonChallengeCompletions,
    ISeasonChallengeHistory
} from "./inventoryTypes/inventoryTypes";
import { IWeaponClient } from "./inventoryTypes/weaponTypes";
import { ISuitClient } from "./inventoryTypes/SuitTypes";

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
    SeasonChallengeHistory: ISeasonChallengeHistory[];
    SeasonChallengeCompletions: ISeasonChallengeCompletions[];
}

export interface IMissionInventoryUpdateRequest {
    rewardsMultiplier?: number;
    ActiveBoosters?: IBooster[];
    AffiliationChanges?: IAffiliationChange[];
    LongGuns?: IWeaponClient[];
    Pistols?: IWeaponClient[];
    Suits?: ISuitClient[];
    Melee?: IWeaponClient[];
    RawUpgrades?: IRawUpgrade[];
    MiscItems?: IMiscItem[];
    Consumables?: IConsumable[];
    Recipes?: IConsumable[];
    RegularCredits?: number;
    ChallengeProgress?: IChallengeProgress[];
    RewardInfo?: IMissionInventoryUpdateRequestRewardInfo;
    FusionPoints?: number;
    Missions?: IMission;
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
