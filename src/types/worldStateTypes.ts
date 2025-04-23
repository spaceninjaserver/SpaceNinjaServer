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
    GlobalUpgrades: IGlobalUpgrade[];
    NodeOverrides: INodeOverride[];
    EndlessXpChoices: IEndlessXpChoice[];
    SeasonInfo: {
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
    Season: string; // "CST_UNDEFINED" | "CST_WINTER" | "CST_SPRING" | "CST_SUMMER" | "CST_FALL"
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
