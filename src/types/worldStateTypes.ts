import { IOid } from "@/src/types/commonTypes";

export interface IMessage {
    LanguageCode?: string;
    Message: string;
}

export interface ILink {
    LanguageCode?: string;
    Link: string;
}

export interface IBaseWorldStateObject {
    Activation: number;
    Expiry: number;
    _id?: IOid;
}

export interface IReward {
    credits?: number;
    xp?: number;
    items?: string[];
    countedItems?: ICountedItems[];
}

export interface ICountedItems {
    ItemType: string;
    ItemCount: number;
}

export interface IMission {
    location: string;
    missionType: string;
    faction: string;
    difficulty: number;
    missionReward: IReward;
    levelOverride: string;
    enemySpec: string;
    minEnemyLevel: number;
    maxEnemyLevel: number;
    descText: string;
    maxWaveNum?: number;
    exclusiveWeapon?: string;
    nightmare?: boolean;
    archwingRequired?: boolean;
    isSharkwing?: boolean;
    advancedSpawners?: string[];
    requiredItems?: string[];
    consumeRequiredItems?: boolean;
    vipAgent?: boolean;
    leadersAlwaysAllowed?: boolean;
    goalTag?: string;
    levelAuras?: string[];
}

export interface IEvent {
    Messages: IMessage[];
    Prop?: string;
    ImageUrl?: string;
    Links?: ILink[];
    Icon?: string;
    Community?: boolean;
    Priority?: boolean;
    EventStartDate?: number;
    EventEndDate?: number;
    MobileOnly?: boolean;
    HideEndDateModifier?: boolean;
    Date?: number;
}

export interface IGoal extends IBaseWorldStateObject {
    Node: string;
    ScoreVar: string;
    ScoreLocTag: string;
    Count: number;
    HealthPct: number;
    Regions: number[];
    Desc: string;
    ToolTip: string;
    OptionalInMission: boolean;
    Tag: string;
    UpgradeIds: IOid[];
    Personal: boolean;
    Community: boolean;
    Goal: number;
    Reward: IReward;
    InterimGoals: number[];
    InterimRewards: IReward[];
}

export interface IAlert extends IBaseWorldStateObject {
    MissionInfo: IMission;
    ForceUnlock: boolean;
    Tag: string;
}

export interface ISortieMission {
    missionType: string;
    modifierType?: string;
    node: string;
    tileset?: string;
}

export interface ISortie extends Omit<ILiteSortie, "Missions"> {
    ExtraDrops: string[]; //Unknown
    Variants: ISortieMission[];
    Twitter: boolean;
}

export interface ILiteSortie extends IBaseWorldStateObject {
    Reward: string;
    Seed: number;
    Boss: string;
    Missions: ISortieMission[];
}

export interface IJob {
    jobType?: string;
    rewards: string;
    masteryReq: number;
    minEnemyLevel: number;
    maxEnemyLevel: number;
    endless?: boolean;
    bonusXpMultiplier?: number;
    xpAmounts: number[];
    locationTag?: string;
    isVault?: boolean;
}
export interface ISyndicateMission extends IBaseWorldStateObject {
    Tag: string;
    Seed: number;
    Nodes: string[];
    Jobs?: IJob[];
}

export interface IActiveMission extends IBaseWorldStateObject {
    Region: number;
    Seed: number;
    Node: string;
    MissionType: string;
    Modifier?: string;
    Hard?: boolean;
}

export interface IGlobalUpgrade extends IBaseWorldStateObject {
    UpgradeType: string;
    OperationType: string;
    Value: string;
}

export interface IFlashSale {
    StartDate: number;
    EndDate: number;
    TypeName: string;
    ShowInMarket: boolean;
    HideFromMarket: boolean;
    SupporterPack: boolean;
    Discount: number;
    RegularOverride: number;
    PremiumOverride: number;
    BogoBuy: number;
    BogoGet: number;
}

export interface IInGameMarket {
    LandingPage: ILandingPage;
}

export interface ILandingPage {
    Categories: ICategory[];
}

export interface ICategory {
    CategoryName: string;
    Name: string;
    Icon: string;
    AddToMenu?: boolean;
    Items: string[];
}

export interface IInvasion extends Omit<IBaseWorldStateObject, "Expiry"> {
    Faction: string;
    DefenderFaction: string;
    Node: string;
    Count: number;
    Goal: number;
    LocTag: string;
    Completed: boolean;
    ChainID: IOid;
    AttackerReward: IReward;
    AttackerMissionInfo: IInvasionMissionInfo;
    DefenderReward: IReward;
    DefenderMissionInfo: IInvasionMissionInfo;
}

export interface IInvasionMissionInfo {
    seed: number;
    faction: string;
}

export interface INodeOverride {
    Activation?: number;
    Expiry?: number;
    Node: string;
    Faction?: string;
    CustomNpcEncounters?: string[];
    LevelOverride?: string;
    Seed?: number;
    Hide?: boolean;
}

export interface IVoidTrader extends IBaseWorldStateObject {
    Character?: string;
    Node: string;
    Completed?: boolean;
    Manifest?: IVoidTraderItem[];
    EvergreenManifest?: IVoidTraderItem[];
    ScheduleInfo?: IVoidTraderScheduleInfo[];
}

export interface IVoidTraderItem {
    ItemType: string;
    PrimePrice?: number;
    RegularPrice?: number;
}

export interface IVoidTraderScheduleInfo extends Omit<IBaseWorldStateObject, "Activation" | "_id"> {
    PreviewHiddenUntil?: number;
    FeaturedItem?: string;
}

export interface IVoidStorm extends IBaseWorldStateObject {
    Node: string;
    ActiveMissionTier: string;
}

export interface IPrimeAccessAvailability {
    State: string;
}

export interface IDailyDeal extends Omit<IBaseWorldStateObject, "_id"> {
    StoreItem: string;
    Discount: number;
    OriginalPrice: number;
    SalePrice: number;
    AmountTotal: number;
    AmountSold: number;
}

export interface ILibraryInfo {
    LastCompletedTargetType: string;
}

export interface IPVPChallengeInstance {
    challengeTypeRefID: string;
    startDate: number;
    endDate: number;
    params: IPVPChallengeInstanceParam[];
    isGenerated: boolean;
    PVPMode: string;
    subChallenges: IOid[];
    Category: string;
}

export interface IPVPChallengeInstanceParam {
    n: string;
    v: number;
}

export interface IEndlessXpChoice {
    Category: string;
    Choices: string[];
}

export interface IFeaturedGuild {
    _id: IOid;
    Name: string;
    Tier: number;
    Emblem: boolean;
    OriginalPlatform: number;
    AllianceId?: IOid;
}

export interface ISeasonInfo extends Omit<IBaseWorldStateObject, "_id"> {
    AffiliationTag: string;
    Season: number;
    Phase: number;
    Params: string;
    ActiveChallenges: IActiveChallenge[];
    UsedChallenges: string[];
}

export interface IActiveChallenge extends IBaseWorldStateObject {
    Daily?: boolean;
    Challenge: string;
}

export interface IWorldState {
    WorldSeed?: string;
    Version?: number;
    MobileVersion?: string;
    BuildLabel?: string;
    Time?: number;
    Events?: IEvent[];
    Goals?: IGoal[];
    Alerts?: IAlert[];
    Sorties: ISortie[];
    LiteSorties: ILiteSortie[];
    SyndicateMissions?: ISyndicateMission[];
    ActiveMissions?: IActiveMission[];
    GlobalUpgrades?: IGlobalUpgrade[];
    FlashSales?: IFlashSale[];
    InGameMarket?: IInGameMarket;
    Invasions?: IInvasion[];
    NodeOverrides?: INodeOverride[];
    VoidTraders?: IVoidTrader[];
    PrimeVaultTraders?: IVoidTrader[];
    VoidStorms?: IVoidStorm[];
    PrimeAccessAvailability?: IPrimeAccessAvailability;
    DailyDeals?: IDailyDeal[];
    LibraryInfo?: ILibraryInfo;
    PVPChallengeInstances?: IPVPChallengeInstance[];
    ProjectPct?: number[];
    EndlessXpChoices?: IEndlessXpChoice[];
    ForceLogoutVersion?: number;
    FeaturedGuilds?: IFeaturedGuild[];
    SeasonInfo: ISeasonInfo;
    Tmp?: string;

    // Unkown
    // HubEvent?: [];
    // PersistentEnemies?: [];
    // PVPAlternativeModes?: [];
    // PVPActiveTournaments?: [];
    // ConstructionProjects?: [];
    // TwitchPromos?: [];
    // ExperimentRecommended?: [];
}
