import { Types } from "mongoose";
import { IOid, IMongoDate } from "@/src/types/commonTypes";
import { IFusionTreasure, IMiscItem, ITypeCount } from "@/src/types/inventoryTypes/inventoryTypes";

export interface IGuildClient {
    _id: IOid;
    Name: string;
    MOTD: string;
    LongMOTD?: ILongMOTD;
    Members: IGuildMemberClient[];
    Ranks: IGuildRank[];
    TradeTax: number;
    Tier: number;
    Vault: IGuildVault;
    ActiveDojoColorResearch: string;
    Class: number;
    XP: number;
    IsContributor: boolean;
    NumContributors: number;
    CeremonyResetDate?: IMongoDate;
}

export interface IGuildDatabase {
    _id: Types.ObjectId;
    Name: string;
    MOTD: string;
    LongMOTD?: ILongMOTD;
    Ranks: IGuildRank[];
    TradeTax: number;
    Tier: number;

    DojoComponents: IDojoComponentDatabase[];
    DojoCapacity: number;
    DojoEnergy: number;

    VaultRegularCredits?: number;
    VaultPremiumCredits?: number;
    VaultMiscItems?: IMiscItem[];
    VaultShipDecorations?: ITypeCount[];
    VaultFusionTreasures?: IFusionTreasure[];

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
}

export interface ILongMOTD {
    message: string;
    authorName: string;
    //authorGuildName: "";
}

// 32 seems to be reserved
export enum GuildPermission {
    Ruler = 1, // Change clan hierarchy
    Advertiser = 8192,
    Recruiter = 2, // Invite members
    Regulator = 4, // Kick members
    Promoter = 8, // Promote and demote members
    Architect = 16, // Create and destroy rooms
    Decorator = 1024, // Create and destroy decos
    Treasurer = 64, // Contribute from vault and edit tax rate
    Tech = 128, // Queue research
    ChatModerator = 512,
    Herald = 2048, // Change MOTD
    Fabricator = 4096 // Replicate research
}

export interface IGuildRank {
    Name: string;
    Permissions: number;
}

export interface IGuildMemberDatabase {
    accountId: Types.ObjectId;
    guildId: Types.ObjectId;
    status: number;
    rank: number;
    RegularCreditsContributed?: number;
    PremiumCreditsContributed?: number;
    MiscItemsContributed?: IMiscItem[];
    ShipDecorationsContributed?: ITypeCount[];
}

export interface IGuildMemberClient {
    _id: IOid;
    Status: number;
    Rank: number;
    DisplayName?: string;
    ActiveAvatarImageType?: string;
    PlayerLevel?: number;
}

export interface IGuildVault {
    DojoRefundRegularCredits?: number;
    DojoRefundMiscItems?: IMiscItem[];
    DojoRefundPremiumCredits?: number;
    ShipDecorations?: ITypeCount[];
    FusionTreasures?: IFusionTreasure[];
    DecoRecipes?: ITypeCount[]; // Event Trophies
}

export interface IDojoClient {
    _id: IOid; // ID of the guild
    Name: string;
    Tier: number;
    FixedContributions: boolean;
    DojoRevision: number;
    AllianceId?: IOid;
    Vault?: IGuildVault;
    Class?: number; // Level
    RevisionTime: number;
    Energy: number;
    Capacity: number;
    DojoRequestStatus: number;
    ContentURL?: string;
    GuildEmblem?: boolean;
    DojoComponents: IDojoComponentClient[];
}

export interface IDojoComponentClient {
    id: IOid;
    pf: string; // Prefab (.level)
    ppf: string;
    pi?: IOid; // Parent ID. N/A to root.
    op?: string; // Name of the door within this room that leads to its parent. N/A to root.
    pp?: string; // Name of the door within the parent that leads to this room. N/A to root.
    Name?: string;
    Message?: string;
    RegularCredits?: number; // "Collecting Materials" state: Number of credits that were donated.
    MiscItems?: IMiscItem[]; // "Collecting Materials" state: Resources that were donated.
    CompletionTime?: IMongoDate;
    RushPlatinum?: number;
    DestructionTime?: IMongoDate;
    Decos?: IDojoDecoClient[];
    DecoCapacity?: number;
}

export interface IDojoComponentDatabase
    extends Omit<IDojoComponentClient, "id" | "pi" | "CompletionTime" | "DestructionTime" | "Decos"> {
    _id: Types.ObjectId;
    pi?: Types.ObjectId;
    CompletionTime?: Date;
    CompletionLogPending?: boolean;
    DestructionTime?: Date;
    Decos?: IDojoDecoDatabase[];
    Leaderboard?: IDojoLeaderboardEntry[];
}

export interface IDojoDecoClient {
    id: IOid;
    Type: string;
    Pos: number[];
    Rot: number[];
    Name?: string; // for teleporters
    RegularCredits?: number;
    MiscItems?: IMiscItem[];
    CompletionTime?: IMongoDate;
    RushPlatinum?: number;
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
    CompletionDate?: IMongoDate;
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
