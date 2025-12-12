import type { IMissionReward, TFaction, TMissionType } from "warframe-public-export-plus";
import type { IMongoDate, IOid } from "./commonTypes.ts";

export interface IWorldState {
    WorldSeed?: string;
    Version: number; // for goals
    MobileVersion?: string; // if present, the companion app may show a warning about being out of dateworldState.Events
    BuildLabel: string;
    Time: number;
    Events?: IEvent[];
    Goals: IGoal[];
    Alerts: IAlert[];
    Sorties: ISortie[];
    LiteSorties: ILiteSortie[];
    SyndicateMissions: ISyndicateMissionInfo[];
    ActiveMissions: IFissure[];
    FlashSales: IFlashSale[];
    GlobalUpgrades: IGlobalUpgrade[];
    InGameMarket: IInGameMarket;
    Invasions: IInvasion[];
    NodeOverrides: INodeOverride[];
    VoidTraders: IVoidTrader[];
    PrimeVaultTraders: IPrimeVaultTrader[];
    VoidStorms: IVoidStorm[];
    DailyDeals: IDailyDeal[];
    PVPChallengeInstances: IPVPChallengeInstance[];
    EndlessXpChoices: IEndlessXpChoice[];
    SeasonInfo?: {
        Activation: IMongoDate;
        Expiry: IMongoDate;
        AffiliationTag: string;
        Season: number;
        Phase: number;
        Params: string;
        ActiveChallenges: ISeasonChallenge[];
    };
    KnownCalendarSeasons: ICalendarSeason[];
    Conquests?: IConquest[];
    Tmp?: string;
}

export interface IEvent {
    _id?: IOid;
    Msg?: string;
    Messages: {
        LanguageCode?: string;
        Message: string;
    }[];
    Prop: string;
    Icon?: string;
    Priority?: boolean;
    MobileOnly?: boolean;
    Community?: boolean;
    Date?: IMongoDate;
    ImageUrl?: string;
    EventEndDate?: IMongoDate;
    HideEndDateModifier?: boolean;
    EventStartDate?: IMongoDate;
    EventLiveUrl?: string;
}

export interface IAlert {
    _id: IOid;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    MissionInfo: IAlertMissionInfo;
    Tag?: string;
    ForceUnlock?: true;
}

export interface IAlertMissionInfo {
    location: string;
    missionType: TMissionType;
    faction: TFaction;
    difficulty: number;
    missionReward?: IMissionReward;
    levelOverride?: string;
    enemySpec?: string;
    extraEnemySpec?: string;
    customAdvancedSpawners?: string[];
    minEnemyLevel?: number;
    maxEnemyLevel?: number;
    maxWaveNum?: number;
    descText?: string;
    enemyCacheOverride?: string;

    maxRotations?: number; // SNS specific field
}

export interface IGoal {
    _id: IOid;
    Activation: IMongoDate;
    Expiry: IMongoDate;

    Count?: number;
    HealthPct?: number;

    Icon?: string;
    Desc: string;
    ToolTip?: string;
    Faction?: string;

    Goal?: number;
    InterimGoals?: number[];
    BonusGoal?: number;
    ClanGoal?: number[];

    Success?: number;
    Personal?: boolean;
    Community?: boolean;
    Best?: boolean; // Use Best instead of Count to check for reward
    Bounty?: boolean; // Tactical Alert
    ClampNodeScores?: boolean;

    Transmission?: string;
    InstructionalItem?: string;
    ItemType?: string;

    Tag: string;
    PrereqGoalTags?: string[];

    Node?: string;
    VictimNode?: string;

    ConcurrentMissionKeyNames?: string[];
    ConcurrentNodeReqs?: number[];
    ConcurrentNodes?: string[];
    RegionIdx?: number;
    Regions?: number[];
    MissionKeyName?: string;

    Reward?: IMissionReward;
    InterimRewards?: IMissionReward[];
    BonusReward?: IMissionReward;

    JobAffiliationTag?: string;
    Jobs?: ISyndicateJob[];
    PreviousJobs?: ISyndicateJob[];
    JobCurrentVersion?: IOid;
    JobPreviousVersion?: IOid;

    ScoreVar?: string;
    ScoreMaxTag?: string; // Field in leaderboard
    ScoreLocTag?: string;

    MissionKeyRotation?: string[];
    MissionKeyRotationInterval?: number;

    OptionalInMission?: boolean;
    UpgradeIds?: IOid[];

    NightLevel?: string;
}

export interface ISyndicateJob {
    jobType?: string;
    rewards: string;
    masteryReq?: number;
    minEnemyLevel: number;
    maxEnemyLevel: number;
    xpAmounts: number[];
    endless?: boolean;
    locationTag?: string;
    isVault?: boolean;
    requiredItems?: string[];
    useRequiredItemsAsMiscItemFee?: boolean;
}

export interface ISyndicateMissionInfo {
    _id: IOid;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Tag: string;
    Seed: number;
    Nodes: string[];
    Jobs?: ISyndicateJob[];
}

export interface IGlobalUpgrade {
    _id: IOid;
    Activation: IMongoDate;
    ExpiryDate: IMongoDate;
    UpgradeType: string;
    OperationType: string;
    Value: number;
    LocalizeTag?: string;
    LocalizeDescTag?: string;
    Nodes?: string[];
}

export interface IInvasion {
    _id: IOid;
    Faction: string;
    DefenderFaction: string;
    Node: string;
    Count: number;
    Goal: number;
    LocTag: string;
    Completed: boolean;
    ChainID: IOid;
    AttackerReward: IMissionReward;
    AttackerMissionInfo: IInvasionMissionInfo;
    DefenderReward: IMissionReward;
    DefenderMissionInfo: IInvasionMissionInfo;
    Activation: IMongoDate;
}

export interface IInvasionMissionInfo {
    seed: number;
    faction: string;
}

export interface IFissure {
    _id: IOid;
    Region: number;
    Seed: number;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Node: string;
    MissionType: string;
    Modifier: string;
    Hard?: boolean;
}

export interface IFissureDatabase {
    Activation: Date;
    Expiry: Date;
    Node: string;
    Modifier: "VoidT1" | "VoidT2" | "VoidT3" | "VoidT4" | "VoidT5" | "VoidT6";
    Hard?: boolean;
}

export interface INodeOverride {
    _id: IOid;
    Activation?: IMongoDate;
    Expiry?: IMongoDate;
    Node: string;
    Hide?: boolean;
    Seed?: number;
    LevelOverride?: string;
    Faction?: string;
    CustomNpcEncounters?: string[];
}

export interface ISortie {
    _id: IOid;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Reward: "/Lotus/Types/Game/MissionDecks/SortieRewards";
    Seed: number;
    Boss: string;
    Variants: {
        missionType: string;
        modifierType: string;
        node: string;
    }[];
}

export interface ISortieMission {
    missionType: string;
    modifierType: string;
    node: string;
    tileset: string;
}

export interface ILiteSortie {
    _id: IOid;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Reward: "/Lotus/Types/Game/MissionDecks/ArchonSortieRewards";
    Seed: number;
    Boss: "SORTIE_BOSS_AMAR" | "SORTIE_BOSS_NIRA" | "SORTIE_BOSS_BOREAL";
    Missions: {
        missionType: string;
        node: string;
    }[];
}

export interface IVoidTrader {
    _id: IOid;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Character: string;
    Node: string;
    Manifest: IVoidTraderOffer[];
}

export interface IVoidTraderOffer {
    ItemType: string;
    PrimePrice: number;
    RegularPrice: number;
    Limit?: number;
}

export interface IVoidStorm {
    _id: IOid;
    Node: string;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    ActiveMissionTier: string;
}

export interface IPrimeVaultTrader {
    _id: IOid;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    InitialStartDate?: IMongoDate;
    Node: string;
    Manifest: IPrimeVaultTraderOffer[];
    EvergreenManifest: IPrimeVaultTraderOffer[];
    ScheduleInfo: IScheduleInfo[];
}

export interface IPrimeVaultTraderOffer {
    ItemType: string;
    PrimePrice?: number;
    RegularPrice?: number;
    StartDate?: IMongoDate;
    EndDate?: IMongoDate;
}

export interface IScheduleInfo {
    Expiry: IMongoDate;
    PreviewHiddenUntil?: IMongoDate;
    FeaturedItem?: string;
}

export interface IDailyDeal {
    StoreItem: string;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Discount: number;
    OriginalPrice: number;
    SalePrice: number;
    AmountTotal: number;
    AmountSold: number;
}

export interface IDailyDealDatabase {
    StoreItem: string;
    Activation: Date;
    Expiry: Date;
    Discount: number;
    OriginalPrice: number;
    SalePrice: number;
    AmountTotal: number;
    AmountSold: number;
}

export interface IPVPChallengeInstance {
    _id: IOid;
    challengeTypeRefID: string;
    startDate: IMongoDate;
    endDate: IMongoDate;
    params: {
        n: string; // "ScriptParamValue";
        v: number;
    }[];
    isGenerated: boolean;
    PVPMode: string;
    subChallenges: IOid[];
    Category: string; // "PVPChallengeTypeCategory_WEEKLY" | "PVPChallengeTypeCategory_WEEKLY_ROOT" | "PVPChallengeTypeCategory_DAILY";
}

export interface IEndlessXpChoice {
    Category: string;
    Choices: string[];
}

export interface ISeasonChallenge {
    _id: IOid;
    Daily?: boolean;
    Permanent?: boolean; // only for getPastWeeklyChallenges response
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Challenge: string;
}

export type CalendarSeasonType = "CST_WINTER" | "CST_SPRING" | "CST_SUMMER" | "CST_FALL";
export interface ICalendarSeason {
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Season: CalendarSeasonType;
    Days: ICalendarDay[];
    YearIteration: number;
    Version: number;
    UpgradeAvaliabilityRequirements: string[];
}

export interface ICalendarDay {
    day: number;
    events: ICalendarEvent[];
}

export interface ICalendarEvent {
    type: string;
    challenge?: string;
    reward?: string;
    upgrade?: string;
    dialogueName?: string;
    dialogueConvo?: string;
}

export type TCircuitGameMode =
    | "Survival"
    | "VoidFlood"
    | "Excavation"
    | "Defense"
    | "Exterminate"
    | "Assassination"
    | "Alchemy";

export interface IFlashSale {
    TypeName: string;
    ShowInMarket: boolean;
    HideFromMarket: boolean;
    SupporterPack: boolean;
    Discount: number;
    BogoBuy: number;
    BogoGet: number;
    PremiumOverride: number;
    RegularOverride: number;
    ProductExpiryOverride?: IMongoDate;
    StartDate: IMongoDate;
    EndDate: IMongoDate;
}

export interface IInGameMarket {
    LandingPage: ILandingPage;
}

export interface ILandingPage {
    Categories: IGameMarketCategory[];
}

export interface IGameMarketCategory {
    CategoryName: string;
    Name: string;
    Icon: string;
    AddToMenu?: boolean;
    Items?: string[];
}

// >= 40.0.0
export type TConquestType = "CT_LAB" | "CT_HEX";
export interface IConquest {
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Type: TConquestType;
    Missions: IConquestMission[];
    Variables: [string, string, string, string];
    RandomSeed: number;
}
export interface IConquestMission {
    faction: TFaction;
    missionType: TMissionType;
    difficulties: [
        {
            type: "CD_NORMAL";
            deviation: string;
            risks: [string];
        },
        {
            type: "CD_HARD";
            deviation: string;
            risks: [string, string];
        }
    ];
}

export interface ITmp {
    cavabegin: string;
    PurchasePlatformLockEnabled: boolean; // Seems unused
    pgr: IPgr;
    ennnd?: boolean; // True if 1999 demo is available (no effect for >=38.6.0)
    mbrt?: boolean; // Related to mobile app rating request
    fbst: IFbst;
    lqo?: IConquestOverride;
    hqo?: IConquestOverride;
    sfn: number;
    edg?: TCircuitGameMode[]; // The Circuit game modes overwrite
}

interface IPgr {
    ts: string;
    en: string;
    fr: string;
    it: string;
    de: string;
    es: string;
    pt: string;
    ru: string;
    pl: string;
    uk: string;
    tr: string;
    ja: string;
    zh: string;
    ko: string;
    tc: string;
    th: string;
}

interface IFbst {
    a: number;
    e: number;
    n: number;
}

// < 40.0.0
interface IConquestOverride {
    mt?: string[];
    mv?: string[];
    mf?: number[];
    c?: [string, string][];
    fv?: string[];
}
