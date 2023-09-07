import {
    IBooster,
    IChallengeProgress,
    IConsumable,
    ICrewShipSalvagedWeaponSkin,
    IMiscItem,
    IRawUpgrade
} from "./inventoryTypes/inventoryTypes";
import { IWeaponDatabase } from "./inventoryTypes/weaponTypes";
import { ISuitDatabase } from "./inventoryTypes/SuitTypes";

interface IArtifactsRequest {
    Upgrade: ICrewShipSalvagedWeaponSkin;
    LevelDiff: number;
    Cost: number;
    FusionPointCost: number;
}

interface IMissionInventoryUpdateRequest {
    rewardsMultiplier?: number;
    ActiveBoosters?: IBooster[];
    LongGuns?: IWeaponDatabase[];
    Pistols?: IWeaponDatabase[];
    Suits?: ISuitDatabase[];
    Melee?: IWeaponDatabase[];
    RawUpgrades?: IRawUpgrade[];
    MiscItems?: IMiscItem[];
    Consumables?: IConsumable[];
    Recipes?: IConsumable[];
    RegularCredits?: number;
    ChallengeProgress?: IChallengeProgress[];
    RewardInfo?: IMissionInventoryUpdateRequestRewardInfo;
    FusionPoints?: number;
}

interface IMissionInventoryUpdateRequestRewardInfo {
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

export { IArtifactsRequest, IMissionInventoryUpdateRequest };
