import type { IMissionReward, TFaction, TMissionType } from "warframe-public-export-plus";
import type { IMongoDateWithLegacySupport, IMongoDate, IOid, IOidWithLegacySupport } from "./commonTypes.ts";
import type { Types } from "mongoose";

export interface IWorldState {
    WorldSeed?: string;
    Version: number; // for goals
    MobileVersion?: string; // if present, the companion app may show a warning about being out of date
    BuildLabel: string;
    Time: number;
    Events: IEvent[];
    Goals: IGoal[] | IGoalV9[];
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
    LibraryInfo?: {
        CurrentTarget?: {
            StartTime: IMongoDateWithLegacySupport;
            TargetType: string;
            EnemyType: string;
            PersonalScansRequired: number;
            ProgressPercent: number;
        };
        LastCompletedTargetType?: string;
    };
    PVPChallengeInstances: IPVPChallengeInstance[];
    EndlessXpChoices?: IEndlessXpChoice[]; // < U42
    EndlessXpSchedule?: IEndlessXpScheduleEntry[]; // >= U42
    FeaturedGuilds: IFeaturedGuild[];
    SeasonInfo?: {
        Activation: IMongoDate; // Nightwave was introduced in U24 so this is fine
        Expiry: IMongoDate;
        AffiliationTag: string;
        Season: number;
        Phase: number;
        Params: string;
        ActiveChallenges: ISeasonChallenge[];
    };
    KnownCalendarSeasons: ICalendarSeason[];
    Conquests?: IConquest[];
    Descents?: IDescent[];
    PrimeVaultAvailabilities: boolean[]; // different in older versions
    PrimeAccessAvailability: { State: string };
    PrimeTokenAvailability: boolean;
    PersistentEnemies: IPersistentEnemy[];
    PVPAlternativeModes: IPVPAltMode[];
    PVPActiveTournaments: IPVPTournament[];
    ConstructionProjects: IConstructionProject[];
    TwitchPromos: { startDate: IMongoDateWithLegacySupport; endDate: IMongoDateWithLegacySupport; type: string }[];
    ProjectPct: [number, number, number];
    ForceLogoutVersion: number;
    ExperimentRecommended: never[]; // idk proper type
    Tmp?: string;
}

interface IEvent {
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
    _id: IOidWithLegacySupport;
    Activation: IMongoDateWithLegacySupport;
    Expiry: IMongoDateWithLegacySupport;
    MissionInfo: IAlertMissionInfo;
    Tag?: string;
    Icon?: string;
    ForceUnlock?: true;
}

export interface IAlertMissionInfo {
    location: string;
    completeTag?: string; // (U7~U8) unsure what this is actually for as it does not seem to produce a Missions field in the updateInventory request either way
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
    questReq?: string;
    vipAgent?: string;
    leadersAlwaysAllowed?: true;
    seed?: number;
    enemyCacheOverride?: string;

    maxRotations?: number; // SNS specific field
}

export interface IGoal extends Omit<IGoalV9, "GoalInterim" | "GoalInterim2" | "RewardInterim" | "RewardInterim2"> {
    GracePeriod?: IMongoDate; // U41+

    InterimGoals?: number[];
    ClanGoal?: number[];

    Community?: boolean;

    RelayReconstruction?: boolean;
    RoamingVIP?: boolean;
    HideWhenComplete?: boolean;
    ScoreTagBlocksGuildTierChanges?: boolean;
    ShowTotalAtEOM?: boolean;
    IsMultiProgress?: boolean;

    InstructionalItem?: string;

    RegionIdx?: number;
    Regions?: number[];

    InterimRewards?: IMissionReward[];

    JobAffiliationTag?: string;
    Jobs?: ISyndicateJob[];
    PreviousJobs?: ISyndicateJob[];
    JobCurrentVersion?: IOid;
    JobPreviousVersion?: IOid;

    MissionKeyRotation?: string[];
    MissionKeyRotationInterval?: number;

    OptionalInMission?: boolean;
    UpgradeIds?: IOid[];

    NightLevel?: string;

    Metadata?: string;
    CompletionBonus?: number[];
    AltExpiry?: IMongoDate;
    EpochNum?: number;
    NextAltActivation?: IMongoDate;
    NextAltExpiry?: IMongoDate;
    PauseAutoScheduling?: boolean;
}

export interface IGoalV9 {
    _id: IOidWithLegacySupport;
    Activation: IMongoDateWithLegacySupport;
    AltActivation?: IMongoDateWithLegacySupport;
    Expiry: IMongoDateWithLegacySupport;

    Count?: number;
    CountAlt?: number;
    ParentCountClamp?: number;
    HealthPct?: number;

    Icon?: string;
    Desc: string;
    CommunityReqDesc?: string;
    ToolTip?: string;
    Faction?: TFaction;

    Goal?: number;
    GoalInterim?: number;
    GoalInterim2?: number;
    BonusGoal?: number;

    Success?: number;
    Personal?: boolean;
    Best?: boolean; // Use Best instead of Count to check for reward
    Ongoing?: boolean;
    Bounty?: boolean; // Tactical Alert
    Fomorian?: boolean;
    Invasion?: boolean;
    ClampNodeScores?: boolean;
    Roaming?: boolean;
    PvpRep?: boolean;

    Transmission?: string;
    ItemType?: string;

    Tag: string;
    ParentTag?: string;
    PrereqGoalTags?: string[];

    Node?: string;
    VictimNode?: string;
    InvasionNode?: string;

    ConcurrentMissionKeyNames?: string[];
    ConcurrentMissionInfo?: IAlertMissionInfo[];
    ConcurrentNodeReqs?: number[];
    ConcurrentNodes?: string[];
    MissionKeyName?: string;
    KeyRequired?: boolean;

    Reward?: IMissionReward;
    RewardInterim?: IMissionReward;
    RewardInterim2?: IMissionReward;
    BonusReward?: IMissionReward;

    ScoreVar?: string;
    ScoreLocTag?: string;
    ScoreSumTag?: string;
    ScoreMaxTag?: string; // Field in leaderboard
    ScoreMaxNode?: string;
    ArchiveTag?: string;

    MissionInfo?: IAlertMissionInfo;

    SuccessHubEvent?: IHubEvent;
    FailureHubEvent?: IHubEvent;
    ContinuousHubEvent?: IHubEvent;

    Types?: string[];
    RewardRegion?: number;

    RegionDrops?: string[];
    ArchwingDrops?: string[];

    WebUrl?: string;

    Diorama?: string;
    RadioSound?: string;

    MaxConclave?: number;
    BonusMaxConclave?: number;

    BonusLevelModifier?: number;
    BonusWaveModifier?: number;
}

interface IHubEvent {
    Transmissions: string[];
    Activation: IMongoDateWithLegacySupport;
    Expiry: IMongoDateWithLegacySupport;
    RepeatInterval: number;
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
    _id: IOidWithLegacySupport;
    Activation: IMongoDateWithLegacySupport;
    Expiry: IMongoDateWithLegacySupport;
    Tag: string;
    Seed: number;
    Nodes: string[];
    Jobs?: ISyndicateJob[];
}

interface IGlobalUpgrade {
    _id: IOidWithLegacySupport;
    Activation: IMongoDateWithLegacySupport;
    ExpiryDate: IMongoDateWithLegacySupport;
    UpgradeType: string;
    OperationType: string;
    Value: number;
    LocalizeTag?: string;
    LocalizeDescTag?: string;
    Nodes?: string[];
}

export interface IInvasion {
    _id: IOidWithLegacySupport;
    Faction: string;
    DefenderFaction: string;
    Node: string;
    Count: number;
    Goal: number;
    LocTag: string;
    Completed: boolean;
    ChainID: IOidWithLegacySupport;
    AttackerReward: IMissionReward;
    AttackerMissionInfo: IInvasionMissionInfo;
    DefenderReward: IMissionReward;
    DefenderMissionInfo: IInvasionMissionInfo;
    Activation: IMongoDateWithLegacySupport;
}

interface IInvasionMissionInfo {
    seed: number;
    faction: string;
}

interface IFissure {
    _id: IOidWithLegacySupport;
    Region: number;
    Seed: number;
    Activation: IMongoDateWithLegacySupport;
    Expiry: IMongoDateWithLegacySupport;
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

interface INodeOverride {
    _id: IOidWithLegacySupport;
    Activation?: IMongoDateWithLegacySupport;
    Expiry?: IMongoDateWithLegacySupport;
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
    missionType: TMissionType;
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
    _id: IOidWithLegacySupport;
    Activation: IMongoDateWithLegacySupport;
    Expiry: IMongoDateWithLegacySupport;
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
    Limit?: number;
    StartDate?: IMongoDate;
    EndDate?: IMongoDate;
}

interface IScheduleInfo {
    Expiry: IMongoDate;
    PreviewHiddenUntil?: IMongoDate;
    FeaturedItem?: string;
}

interface IDailyDeal {
    StoreItem: string;
    Activation: IMongoDateWithLegacySupport;
    Expiry: IMongoDateWithLegacySupport;
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
    _id: Types.ObjectId;
}

export interface IPVPChallengeInstance {
    _id: IOidWithLegacySupport;
    challengeTypeRefID: string;
    startDate: IMongoDateWithLegacySupport;
    endDate: IMongoDateWithLegacySupport;
    params: {
        n: string; // "ScriptParamValue";
        v: number;
    }[];
    isGenerated: boolean;
    PVPMode: string;
    subChallenges: IOidWithLegacySupport[];
    Category: string; // "PVPChallengeTypeCategory_WEEKLY" | "PVPChallengeTypeCategory_WEEKLY_ROOT" | "PVPChallengeTypeCategory_DAILY";
}

export interface IEndlessXpChoice {
    Category: string;
    Choices: string[];
}

interface IEndlessXpScheduleEntry {
    Activation: IMongoDate;
    Expiry: IMongoDate;
    CategoryChoices: IEndlessXpChoice[];
}

interface IFeaturedGuild {
    _id: IOid;
    Name: string;
    Tier: number;
    AllianceId?: IOid;
    Emblem?: boolean;
    HiddenPlatforms?: {
        PLATFORM_WINDOWS?: true;
        PLATFORM_XBONE?: true;
        PLATFORM_XSX?: true;
        PLATFORM_PS4?: true;
        PLATFORM_PS5?: true;
        PLATFORM_SWITCH?: true;
        PLATFORM_SWITCH2?: true;
        PLATFORM_IOS?: true;
        PLATFORM_ANDROID?: true;
        PLATFORM_CROSS_PLATFORM?: true;
    };
    IconOveride?: 0 | 1;
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
    ShowInMarket?: boolean;
    HideFromMarket?: boolean;
    SupporterPack?: boolean;
    Discount?: number;
    BogoBuy?: number;
    BogoGet?: number;
    PremiumOverride?: number;
    RegularOverride?: number;
    ProductExpiryOverride?: IMongoDateWithLegacySupport;
    StartDate: IMongoDateWithLegacySupport;
    EndDate: IMongoDateWithLegacySupport;

    // Pre-U22.9 fields
    Featured?: boolean;
    Popular?: boolean;
    BannerIndex?: number;
}

interface IInGameMarket {
    LandingPage: ILandingPage;
}

interface ILandingPage {
    Categories: IGameMarketCategory[];
}

interface IGameMarketCategory {
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

export interface IDescent {
    Activation: IMongoDate;
    Expiry: IMongoDate;
    RandSeed: number;
    Challenges: IDescentFloor[];
}

export interface IDescentFloor {
    Index: number; // 1..21
    Type: string;
    Challenge: string;
    Level: string;
    Specs: string[];
    Auras: string[];
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

interface IPersistentEnemy {
    _id: IOidWithLegacySupport;
    StartTime: IMongoDateWithLegacySupport;
    AgentType: string;
    LocTag: string;
    Icon: string;
    Rank: number;
    HealthPercent: number;
    FleeDamage: number;
    UseTicketing: boolean;
    Region: number;
    Discovered: boolean;
    LastDiscoveredLocation: string; // SolNode
    LastDiscoveredTime: IMongoDateWithLegacySupport;

    // I'm not sure about that - it's not in the ws archives, but the game does parse those fields
    EnhancementIndex?: number;
    LeaderWeaponType?: string;
    MinionAgentTypes?: string[];
    MinionWeaponTypes?: string[];
}

interface IPVPAltMode {
    TargetMode: string;

    TitleLoc: string;
    DescriptionLoc: string;

    DisableEnergyPickups: boolean;
    DisableEnergySurge: boolean;
    DisableAmmoPickups: boolean;
    DisableWeaponSwitching: boolean;
    DisableWeaponHud: boolean;
    ForceChangeLoadoutOnDeath: boolean;

    MatchTimeOverride: number;
    EnergyCapOverride: number;
    MaxPlayersOverride: number;
    MinPlayersPerTeamOverride: number;
    MaxTeamCountDifferenceOverride: number;

    WeaponOverrides: IPVPAltModeWeaponOverride[];
    MeleeWeaponOverride: IPVPAltModeMeleeOverride;
}

interface IPVPAltModeWeaponOverride {
    Override: boolean;
    UseFirstAsDefault: boolean;
    Resources: string[];
    OriginalVersions: string[];
}

interface IPVPAltModeMeleeOverride extends IPVPAltModeWeaponOverride {
    IsModularMeleeWeapon: boolean;
    BalancesPool: string[];
    HandlesPool: string[];
    TipsPool: string[];
}

interface IPVPTournament {
    TargetMode: string;
    StartDate: IMongoDateWithLegacySupport;
    EndDate: IMongoDateWithLegacySupport;
    Week: number;
    Season: number;
}

interface IConstructionProject {
    Tag: string;
    Node: string;
    Activation: IMongoDateWithLegacySupport;
    EarlyAccess: IMongoDateWithLegacySupport;
    PublicAccess: IMongoDateWithLegacySupport;
    Completed: boolean;
    Phases: IConstructionPhase[];
}

interface IConstructionPhase {
    GoalId: IOidWithLegacySupport;
    Option0: number; // ???
    Option1: number; // ???
    RequiredCount: number;
    RequiredCountGuild: [{ Tier: string }, { Tier: string }, { Tier: string }]; // ???
    ClanResearchRecipe: string;
}
