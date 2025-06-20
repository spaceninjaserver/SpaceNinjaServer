import { IMongoDate, IOid } from "./commonTypes";

export interface IWorldState {
    Version: number; // for goals
    BuildLabel: string;
    Time: number;
    Goals: IGoal[];
    Alerts: [];
    Sorties: ISortie[];
    LiteSorties: ILiteSortie[];
    SyndicateMissions: ISyndicateMissionInfo[];
    ActiveMissions: IFissure[];
    GlobalUpgrades: IGlobalUpgrade[];
    NodeOverrides: INodeOverride[];
    VoidStorms: IVoidStorm[];
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
    Tmp?: string;
}

export interface IGoal {
    _id: IOid;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Count: number;
    Goal: number;
    Success: number;
    Personal: boolean;
    Desc: string;
    ToolTip: string;
    Icon: string;
    Tag: string;
    Node: string;
}

export interface ISyndicateMissionInfo {
    _id: IOid;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Tag: string;
    Seed: number;
    Nodes: string[];
    Jobs?: {
        jobType?: string;
        rewards: string;
        masteryReq: number;
        minEnemyLevel: number;
        maxEnemyLevel: number;
        xpAmounts: number[];
        endless?: boolean;
        locationTag?: string;
        isVault?: boolean;
    }[];
}

export interface IGlobalUpgrade {
    _id: IOid;
    Activation: IMongoDate;
    ExpiryDate: IMongoDate;
    UpgradeType: string;
    OperationType: string;
    Value: number;
    LocalizeTag: string;
    LocalizeDescTag: string;
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
    CustomNpcEncounters?: string;
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

export interface IVoidStorm {
    _id: IOid;
    Node: string;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    ActiveMissionTier: string;
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
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Challenge: string;
}

export interface ICalendarSeason {
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Season: "CST_WINTER" | "CST_SPRING" | "CST_SUMMER" | "CST_FALL";
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

export interface ITmp {
    cavabegin: string;
    PurchasePlatformLockEnabled: boolean; // Seems unused
    pgr: IPgr;
    ennnd?: boolean; // True if 1999 demo is available (no effect for >=38.6.0)
    mbrt?: boolean; // Related to mobile app rating request
    fbst: IFbst;
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
