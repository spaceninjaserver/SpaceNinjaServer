import type { IColour, TRarity } from "warframe-public-export-plus";

export interface IExportCustoms {
    ExportCustoms: ICustom[];
}

export interface ICustom {
    uniqueName: string;
    name: string;
    codexSecret: boolean;
    description?: string;
    excludeFromCodex?: boolean;
}

export interface IExportDrones {
    ExportDrones: IDrone[];
}

export interface IDrone {
    uniqueName: string;
    name: string;
    description: string;
    binCount: number;
    binCapacity: number;
    fillRate: number;
    durability: number;
    repairRate: number;
    codexSecret: boolean;
    capacityMultiplier: number[];
    specialities: [];
}

export interface IExportFlavour {
    ExportFlavour: IFlavour[];
}

export interface IFlavour {
    uniqueName: string;
    name: string;
    description: string;
    codexSecret: boolean;
    excludeFromCodex?: boolean;
    hexColours?: IColour[];
}

export interface IExportFusionBundles {
    ExportFusionBundles: IFusionBundle[];
}

export interface IFusionBundle {
    uniqueName: string;
    description: string;
    codexSecret: boolean;
    fusionPoints: number;
}

export interface IExportGear {
    ExportGear: IGear[];
}

export interface IGear {
    uniqueName: string;
    name: string;
    description: string;
    codexSecret: boolean;
    parentName: string;
}

export interface IExportKeys {
    ExportKeys: IKey[];
}

export interface IKey {
    uniqueName: string;
    name: string;
    description: string;
    parentName: string;
    codexSecret: boolean;
    excludeFromCodex?: boolean;
}

export interface IExportManifest {
    Manifest: IIconMapping[];
}

export interface IIconMapping {
    uniqueName: string;
    textureLocation: string;
}

export interface IExportRecipes {
    ExportRecipes: IRecipe[];
}

export interface IRecipe {
    uniqueName: string;
    resultType: string;
    buildPrice: number;
    buildTime: number;
    skipBuildTimePrice: number;
    consumeOnUse: boolean;
    num: number;
    codexSecret: boolean;
    ingredients: {
        ItemType: string;
        ItemCount: number;
        ProductCategory: string;
    }[];
    secretIngredients: {
        ItemType: string;
        ItemCount: number;
    }[];
    excludeFromCodex?: boolean;
    primeSellingPrice?: number;
    alwaysAvailable?: boolean;
}

export interface IExportRegions {
    ExportRegions: IRegion[];
}

export interface IRegion {
    uniqueName: string;
    name: string;
    systemIndex: number;
    systemName: string;
    nodeType: number;
    masteryReq: number;
    missionIndex: number;
    factionIndex: number;
    minEnemyLevel: number;
    maxEnemyLevel: number;
}

export interface IExportRelicArcane {
    ExportRelicArcane: IRelicArcane[];
}

export interface IRelicArcane {
    uniqueName: string;
    name: string;
    codexSecret: boolean;
    description?: string;
    relicRewards?: {
        rewardName: string;
        rarity: TRarity;
        tier: number;
        itemCount: number;
    }[];
    rarity?: TRarity;
    levelStats?: {
        stats: string[];
    }[];
    excludeFromCodex?: boolean;
}

export interface IExportResources {
    ExportResources: IResource[];
}

export interface IResource {
    uniqueName: string;
    name: string;
    description: string;
    codexSecret: boolean;
    parentName: string;
    excludeFromCodex?: boolean;
    showInInventory?: boolean;
    longDescription?: string;
    primeSellingPrice?: number;
}
export interface IExportSentinels {
    ExportSentinels: ISentinel[];
}

export interface ISentinel {
    uniqueName: string;
    name: string;
    health: number;
    shield: number;
    armor: number;
    stamina: number;
    power: number;
    codexSecret: boolean;
    excludeFromCodex?: boolean;
    description: string;
    productCategory: string;
}

export interface IExportSortieRewards {
    ExportSortieRewards: ISortieReward[];
    ExportNightwave: IExportNightwave;
    ExportRailjack: IExportRailjack;
    ExportIntrinsics: IIntrinsic[];
    ExportOther: IOther[];
}

export interface IIntrinsic {
    name: string;
    ranks: {
        name: string;
        description: string;
    }[];
}

export interface IExportNightwave {
    affiliationTag: string;
    challenges: INightwaveChallenge[];
    rewards: INightwaveReward[];
}

export interface INightwaveChallenge {
    uniqueName: string;
    name: string;
    description: string;
    standing: number;
    required: number;
}

export interface INightwaveReward {
    uniqueName: string;
    itemCount?: number;
    name?: string;
    description?: string;
    components?: string[];
}

export interface IOther {
    uniqueName: string;
    name: string;
    description: string;
    excludeFromCodex?: boolean;
}

export interface IExportRailjack {
    nodes: {
        uniqueName: string;
        name: string;
    }[];
}

export interface ISortieReward {
    rewardName: string;
    rarity: "COMMON";
    tier: number;
    itemCount: number;
    probability: number;
}

export interface IExportUpgrades {
    ExportUpgrades: IUpgrade[];
    ExportModSet: IModSet[];
    ExportAvionics: IAvionicsFocus[];
    ExportFocusUpgrades: IAvionicsFocus[];
}

type TPolarity =
    | "AP_ANY"
    | "AP_ATTACK"
    | "AP_DEFENSE"
    | "AP_POWER"
    | "AP_PRECEPT"
    | "AP_TACTIC"
    | "AP_UMBRA"
    | "AP_UNIVERSAL"
    | "AP_WARD";

export interface IAvionicsFocus {
    uniqueName: string;
    name: string;
    polarity: TPolarity;
    rarity: TRarity;
    codexSecret: boolean;
    baseDrain: number;
    fusionLimit: number;
    levelStats?: {
        stats: string[];
    }[];
    excludeFromCodex?: boolean;
}

export interface IModSet {
    uniqueName: string;
    numUpgradesInSet: number;
    stats: string[];
    buffSet?: boolean;
}

export interface IUpgrade {
    uniqueName: string;
    name: string;
    polarity: TPolarity;
    rarity: TRarity;
    codexSecret: boolean;
    baseDrain: number;
    fusionLimit: number;
    compatName?: string;
    type?: string;
    description?: string[];
    isUtility?: boolean;
    levelStats?: {
        stats: string[];
    }[];
    modSet?: string;
    modSetValues?: number[];
    subtype?: string;
    excludeFromCodex?: boolean;
    upgradeEntries?: UpgradeEntry[];
    availableChallenges?: AvailableChallenge[];
}

interface AvailableChallenge {
    fullName: string;
    description: string;
    complications: Complication[];
}

interface Complication {
    fullName: string;
    description: string;
    overrideTag?: string;
}

interface UpgradeEntry {
    tag: string;
    prefixTag: string;
    suffixTag: string;
    upgradeValues: UpgradeValue[];
}

interface UpgradeValue {
    value: number;
    locTag?: string;
    reverseValueSymbol?: boolean;
}

export interface IExportWarframes {
    ExportWarframes: IWarframe[];
    ExportAbilities: IAbility[];
}

export interface IAbility {
    abilityUniqueName: string;
    abilityName: string;
    description: string;
}

export interface IWarframe {
    uniqueName: string;
    name: string;
    parentName: string;
    description: string;
    health: number;
    shield: number;
    armor: number;
    stamina: number;
    power: number;
    codexSecret: boolean;
    masteryReq: number;
    sprintSpeed: number;
    abilities: IAbility[];
    productCategory: "MechSuits" | "SpaceSuits" | "Suits";
    passiveDescription?: string;
    exalted?: string[];
    longDescription?: string;
}

export interface IExportWeapons {
    ExportWeapons: IWeapon[];
    ExportRailjackWeapons: IRailjackWeapon[];
}

type TNoise = "ALARMING" | "SILENT";

type TTrigger = "ACTIVE" | "AUTO" | "Auto Burst" | "BURST" | "CHARGE" | "DUPLEX" | "HELD" | "SEMI";

export interface IRailjackWeapon {
    name: string;
    uniqueName: string;
    codexSecret: boolean;
    damagePerShot: number[];
    totalDamage: number;
    description: string;
    criticalChance: number;
    criticalMultiplier: number;
    procChance: number;
    fireRate: number;
    masteryReq: number;
    productCategory: "CrewShipWeapons";
    excludeFromCodex: boolean;
    slot: number;
    accuracy: number;
    omegaAttenuation: number;
    noise: TNoise;
    trigger: TTrigger;
    magazineSize: number;
    reloadTime: number;
    multishot: number;
}

export interface IWeapon {
    name: string;
    uniqueName: string;
    codexSecret: boolean;
    damagePerShot: number[];
    totalDamage: number;
    description: string;
    criticalChance: number;
    criticalMultiplier: number;
    procChance: number;
    fireRate: number;
    masteryReq: number;
    productCategory: string;
    slot?: number;
    accuracy?: number;
    omegaAttenuation: number;
    noise?: TNoise;
    trigger?: TTrigger;
    magazineSize?: number;
    reloadTime?: number;
    multishot?: number;
    blockingAngle?: number;
    comboDuration?: number;
    followThrough?: number;
    range?: number;
    slamAttack?: number;
    slamRadialDamage?: number;
    slamRadius?: number;
    slideAttack?: number;
    heavyAttackDamage?: number;
    heavySlamAttack?: number;
    heavySlamRadialDamage?: number;
    heavySlamRadius?: number;
    windUp?: number;
    maxLevelCap?: number;
    sentinel?: boolean;
    excludeFromCodex?: boolean;
    primeOmegaAttenuation?: number;
}
