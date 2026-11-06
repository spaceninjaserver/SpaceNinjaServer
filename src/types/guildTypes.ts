import type { Types } from "mongoose";
import type {
    IOid,
    IMongoDate,
    IOidWithLegacySupport,
    ITypeCount,
    IMongoDateWithLegacySupport
} from "./commonTypes.ts";
import type {
    IFusionTreasure,
    IMiscItem,
    IGoalProgressDatabase,
    IGoalProgressClient
} from "./inventoryTypes/inventoryTypes.ts";
import type { IPictureFrameInfo } from "./personalRoomsTypes.ts";
import type { IFriendInfo } from "./friendTypes.ts";

export interface IGuildClient {
    _id: IOidWithLegacySupport;
    Name: string;
    MOTD: string;
    LongMOTD?: ILongMOTD;
    Members: IGuildMemberClient[];
    Ranks: IGuildRank[];
    Tier: number;
    GuildTierIncMoratorium?: IMongoDateWithLegacySupport;
    Emblem?: boolean;
    Vault: IGuildVaultClient;
    ActiveDojoColorResearch: string;
    Class: number;
    XP: number;
    IsContributor: boolean;
    NumContributors: number;
    FixedContributions?: boolean;
    CeremonyResetDate?: IMongoDateWithLegacySupport;
    CrossPlatformEnabled?: boolean;
    AutoContributeFromVault?: boolean;
    AllianceId?: IOidWithLegacySupport;

    GoalProgress?: IGoalProgressClient[];
}
// Fields specific to SNS
export interface IGuildCheats {
    noDojoRoomBuildStage?: boolean;
    fastDojoRoomDestruction?: boolean;
    noDojoDecoBuildStage?: boolean;
    noDojoResearchCosts?: boolean;
    noDojoResearchTime?: boolean;
    fastClanAscension?: boolean;
}

export interface IGuildDatabase extends IGuildCheats, IVaultDatabase {
    _id: Types.ObjectId;
    Name: string;
    MOTD: string;
    LongMOTD?: ILongMOTD;
    Ranks: IGuildRank[];
    TradeTax: number;
    Tier: number;
    GuildTierIncMoratorium?: Date;
    Emblem?: boolean;
    AutoContributeFromVault?: boolean;
    AllianceId?: Types.ObjectId;
    Featured?: boolean;

    DojoComponents: IDojoComponentDatabase[];
    DojoCapacity: number;
    DojoEnergy: number;

    TechProjects?: ITechProjectDatabase[];
    ActiveDojoColorResearch: string;

    Class: number;
    XP: number;
    ClaimedXP?: string[]; // track rooms and decos that have already granted XP
    CeremonyClass?: number;
    CeremonyEndo?: number;
    CeremonyContributors?: Types.ObjectId[];
    CeremonyResetDate?: Date;

    RoomChanges?: IGuildLogRoomChange[];
    TechChanges?: IGuildLogEntryContributable[];
    RosterActivity?: IGuildLogEntryRoster[];
    ClassChanges?: IGuildLogEntryNumber[];

    GoalProgress?: IGoalProgressDatabase[];
}

export interface ILongMOTD {
    message: string;
    authorName: string;
    authorGuildName?: string;
}

export const eGuildPermission = {
    Ruler: 1, // Clan: Change hierarchy. Alliance (Creator only): Kick clans.
    Advertiser: 8192,
    Recruiter: 2, // Send invites (Clans & Alliances)
    Regulator: 4, // Kick members
    Promoter: 8, // Clan: Promote and demote members. Alliance (Creator only): Change clan permissions.
    Architect: 16, // Create and destroy rooms
    Host: 32, // No longer used in modern versions
    Decorator: 1024, // Create and destroy decos
    Treasurer: 64, // Clan: Contribute from vault and edit tax rate. Alliance: Divvy vault.
    Tech: 128, // Queue research
    Tactician: 256, // Start Solar Rail Craft & Deploy Solar Rails
    ChatModerator: 512, // (Clans & Alliances)
    Herald: 2048, // Change MOTD
    Fabricator: 4096 // Replicate research
} as const;
export type TGuildPermission = (typeof eGuildPermission)[keyof typeof eGuildPermission];

export const eDojoRequestStatus = {
    INVALID_PERMISSION: -1,
    RECIPE_NOT_FOUND: -2,
    BAD_REQUEST: -3,
    INSUFFICIENT_FUNDS: -4,
    NO_PURCHASES: -5,
    ALLIANCE_MAX_SIZE: -6,
    GUILD_INCREASE_MORATORIUM_ACTIVE: -7,
    CDN_URL_STALE: -8,
    VALID_REQUEST: 0,
    REVISION_NOT_LATEST: 1,
    PARENT_NO_LONGER_EXISTS: 2,
    PARENT_DESTRUCTION_QUEUED: 3,
    INSUFFICIENT_ENERGY: 4,
    INSUFFICIENT_CAPACITY: 5,
    MISSING_PREREQ: 6,
    COMPONENT_NOT_FOUND: 7,
    CONSTRUCTION_STARTED: 8,
    ALREADY_ABORTING: 9,
    PREVENTED_OVERCONTRIBUTION: 10,
    NOT_BUILDING_YET: 11,
    ALREADY_COMPLETED: 12,
    HAS_CHILD: 13,
    DESTRUCTION_ALREADY_QUEUED: 14,
    NOT_QUEUED_FOR_DESTRUCTION: 15,
    COMPONENT_DESTROYED: 16,
    LOCATION_OCCUPIED: 17,
    COMPONENT_LOCKED: 18
} as const;
export type TDojoRequestStatus = (typeof eDojoRequestStatus)[keyof typeof eDojoRequestStatus];

export interface IGuildRank {
    Name: string;
    Permissions: number;
}

export interface IGuildMemberDatabase {
    accountId: Types.ObjectId;
    guildId: Types.ObjectId;
    status: number;
    rank: number;
    RequestMsg?: string;
    RequestExpiry?: Date;
    RegularCreditsContributed?: number;
    PremiumCreditsContributed?: number;
    MiscItemsContributed?: IMiscItem[];
    ShipDecorationsContributed?: ITypeCount[];
}

// GuildMemberInfo
export interface IGuildMemberClient extends IFriendInfo {
    Rank: number;
    Joined?: IMongoDate;
    RequestExpiry?: IMongoDate;
    RegularCreditsContributed?: number;
    PremiumCreditsContributed?: number;
    MiscItemsContributed?: IMiscItem[];
    ConsumablesContributed?: ITypeCount[];
    ShipDecorationsContributed?: ITypeCount[];
}

export interface IVaultDatabase {
    VaultRegularCredits?: number;
    VaultPremiumCredits?: number;
    VaultMiscItems?: IMiscItem[];
    VaultShipDecorations?: ITypeCount[];
    VaultFusionTreasures?: IFusionTreasure[];
    VaultDecoRecipes?: ITypeCount[];
    VaultRecipes?: ITypeCount[];
    VaultInventoryItems?: ITypeCount[];
    VaultPendingRecipes?: IVaultPendingRecipeDatabase[];

    MaxBattlePayReserve?: number;
    MaxMissionBattlePay?: number;
    MinMissionBattlePay?: number;
}
export interface IGuildVaultClient {
    DojoRefundRegularCredits?: number;
    DojoRefundMiscItems?: IMiscItem[];
    DojoRefundPremiumCredits?: number;
    ShipDecorations?: ITypeCount[];
    FusionTreasures?: IFusionTreasure[];
    DecoRecipes?: ITypeCount[]; // Event Trophies
    Recipes?: ITypeCount[]; // Solar Rail

    MaxBattlePayReserve?: number;
    MaxMissionBattlePay?: number;
    MinMissionBattlePay?: number;
    InventoryItems?: Record<string, ITypeCount[]>;
    PendingRecipes?: Record<string, IVaultPendingRecipeClient[]>;
}

export interface IVaultPendingRecipeDatabase {
    ParentRoom: Types.ObjectId;
    ParentGuildId: Types.ObjectId;
    MiscItems?: IMiscItem[];
    RegularCredits?: number;
    RushPlatinum?: number;
    CompletionTime?: Date;
    Type: string;
    RecipeType: string;
    TimeRemaining?: number;
}

export interface IVaultPendingRecipeClient extends Omit<
    IVaultPendingRecipeDatabase,
    "CompletionTime" | "ParentRoom" | "ParentGuildId" | "RecipeType"
> {
    ParentRoom: IOidWithLegacySupport;
    ParentGuildId: IOidWithLegacySupport;
    CompletionTime?: IMongoDate;
}

export interface IDojoClient {
    _id: IOidWithLegacySupport; // ID of the guild
    Name: string;
    Tier: number;
    TradeTax?: number;
    FixedContributions: boolean;
    DojoRevision: number;
    AllianceId?: IOidWithLegacySupport;
    Vault?: IGuildVaultClient;
    Class?: number; // Level
    RevisionTime: number;
    Energy: number;
    Capacity: number;
    DojoRequestStatus: TDojoRequestStatus;
    ContentURL?: string;
    GuildEmblem?: boolean;
    DojoComponents: IDojoComponentClient[];
    NumContributors?: number;
    CeremonyResetDate?: IMongoDate;
}

export interface IDojoComponentClient {
    id: IOidWithLegacySupport;
    SortId?: IOidWithLegacySupport;
    pf: string; // Prefab (.level)
    ppf: string;
    pi?: IOidWithLegacySupport; // Parent ID. N/A to root.
    op?: string; // Name of the door within this room that leads to its parent. N/A to root.
    pp?: string; // Name of the door within the parent that leads to this room. N/A to root.
    Name?: string;
    Message?: string;
    RegularCredits?: number; // "Collecting Materials" state: Number of credits that were donated.
    MiscItems?: IMiscItem[]; // "Collecting Materials" state: Resources that were donated.
    CompletionTime?: IMongoDate; // new versions
    TimeRemaining?: number; // old versions
    RushPlatinum?: number;
    DestructionTime?: IMongoDate; // new versions
    DestructionTimeRemaining?: number; // old versions
    Decos?: IDojoDecoClient[];
    DecoCapacity?: number;
    PaintBot?: IOidWithLegacySupport;
    PendingColors?: number[];
    Colors?: number[];
    PendingLights?: number[];
    Lights?: number[];
    Settings?: string;
}

export interface IDojoComponentSettings {
    decorators?: string[];
}

export interface IDojoComponentDatabase extends Omit<
    IDojoComponentClient,
    | "id"
    | "SortId"
    | "pi"
    | "CompletionTime"
    | "TimeRemaining"
    | "DestructionTime"
    | "DestructionTimeRemaining"
    | "Decos"
    | "PaintBot"
> {
    _id: Types.ObjectId;
    SortId?: Types.ObjectId;
    pi?: Types.ObjectId;
    CompletionTime?: Date;
    CompletionLogPending?: boolean;
    DestructionTime?: Date;
    Decos?: IDojoDecoDatabase[];
    PaintBot?: Types.ObjectId;
    Leaderboard?: IDojoLeaderboardEntry[];
}

export interface IDojoDecoClient {
    id: IOidWithLegacySupport;
    Type: string;
    Pos: number[];
    Rot: number[];
    Scale?: number;
    Name?: string; // for teleporters
    Sockets?: number;
    RegularCredits?: number;
    MiscItems?: IMiscItem[];
    CompletionTime?: IMongoDate; // new versions
    TimeRemaining?: number; // old versions
    RushPlatinum?: number;
    PictureFrameInfo?: IPictureFrameInfo;
    Pending?: boolean;
}

export interface IDojoDecoDatabase extends Omit<IDojoDecoClient, "id" | "CompletionTime"> {
    _id: Types.ObjectId;
    CompletionTime?: Date;
}

// A common subset of the database representation of rooms & decos.
export interface IDojoContributable {
    RegularCredits?: number;
    MiscItems?: IMiscItem[];
    CompletionTime?: Date;
    RushPlatinum?: number;
}

export interface ITechProjectClient {
    ItemType: string;
    ReqCredits: number;
    ReqItems: IMiscItem[];
    State: number; // 0 = pending, 1 = complete
    CompletionDate?: IMongoDateWithLegacySupport;
}

export interface ITechProjectDatabase extends Omit<ITechProjectClient, "CompletionDate"> {
    CompletionDate?: Date;
}

export interface IGuildLogEntryContributable {
    dateTime?: Date;
    entryType: number;
    details: string;
}

export interface IGuildLogRoomChange extends IGuildLogEntryContributable {
    componentId: Types.ObjectId;
}

export interface IGuildLogEntryRoster {
    dateTime: Date;
    entryType: number;
    details: string;
}

export interface IGuildLogEntryNumber {
    dateTime: Date;
    entryType: number;
    details: number;
}

export interface IDojoLeaderboardEntry {
    s: number; // score
    r: number; // rank
    n: string; // displayName
}

export interface IGuildAdInfoClient {
    _id: IOid; // Guild ID
    CrossPlatformEnabled: boolean;
    Emblem?: boolean;
    Expiry: IMongoDate;
    Features: number;
    GuildName: string;
    MemberCount: number;
    OriginalPlatform: number;
    RecruitMsg: string;
    Tier: number;
}

export interface IGuildAdDatabase {
    GuildId: Types.ObjectId;
    Emblem?: boolean;
    Expiry: Date;
    Features: number;
    GuildName: string;
    MemberCount: number;
    RecruitMsg: string;
    Tier: number;
}

export interface IAllianceClient {
    _id: IOidWithLegacySupport;
    Name: string;
    MOTD?: ILongMOTD;
    LongMOTD?: ILongMOTD;
    Emblem?: boolean;
    CrossPlatformEnabled?: boolean;
    Clans: IAllianceMemberClient[];
    OriginalPlatform?: number;
    AllianceVault?: IGuildVaultClient;
}

export interface IAllianceDatabase extends IVaultDatabase {
    _id: Types.ObjectId;
    Name: string;
    MOTD?: ILongMOTD;
    LongMOTD?: ILongMOTD;
    Emblem?: boolean;
}

export interface IAllianceMemberClient {
    _id: IOidWithLegacySupport;
    Name: string;
    Tier: number;
    Pending: boolean;
    Emblem?: boolean;
    Permissions: number;
    MemberCount: number;
    ClanLeader?: string;
    ClanLeaderId?: IOidWithLegacySupport;
    OriginalPlatform?: number;
}

export interface IAllianceMemberDatabase {
    allianceId: Types.ObjectId;
    guildId: Types.ObjectId;
    Pending: boolean;
    Permissions: number;
}
