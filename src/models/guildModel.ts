import {
    IGuildDatabase,
    IDojoComponentDatabase,
    ITechProjectDatabase,
    IDojoDecoDatabase,
    ILongMOTD,
    IGuildMemberDatabase,
    IGuildLogEntryNumber,
    IGuildRank,
    IGuildLogRoomChange,
    IGuildLogEntryRoster,
    IGuildLogEntryContributable,
    IDojoLeaderboardEntry
} from "@/src/types/guildTypes";
import { Document, Model, model, Schema, Types } from "mongoose";
import { fusionTreasuresSchema, typeCountSchema } from "./inventoryModels/inventoryModel";

const dojoDecoSchema = new Schema<IDojoDecoDatabase>({
    Type: String,
    Pos: [Number],
    Rot: [Number],
    Name: String,
    RegularCredits: Number,
    MiscItems: { type: [typeCountSchema], default: undefined },
    CompletionTime: Date,
    RushPlatinum: Number
});

const dojoLeaderboardEntrySchema = new Schema<IDojoLeaderboardEntry>(
    {
        s: Number,
        r: Number,
        n: String
    },
    { _id: false }
);

const dojoComponentSchema = new Schema<IDojoComponentDatabase>({
    pf: { type: String, required: true },
    ppf: String,
    pi: Schema.Types.ObjectId,
    op: String,
    pp: String,
    Name: String,
    Message: String,
    RegularCredits: Number,
    MiscItems: { type: [typeCountSchema], default: undefined },
    CompletionTime: Date,
    CompletionLogPending: Boolean,
    RushPlatinum: Number,
    DestructionTime: Date,
    Decos: [dojoDecoSchema],
    DecoCapacity: Number,
    Leaderboard: { type: [dojoLeaderboardEntrySchema], default: undefined }
});

const techProjectSchema = new Schema<ITechProjectDatabase>(
    {
        ItemType: String,
        ReqCredits: Number,
        ReqItems: [typeCountSchema],
        State: Number,
        CompletionDate: Date
    },
    { _id: false }
);

const longMOTDSchema = new Schema<ILongMOTD>(
    {
        message: String,
        authorName: String
    },
    { _id: false }
);

const guildRankSchema = new Schema<IGuildRank>(
    {
        Name: String,
        Permissions: Number
    },
    { _id: false }
);

const defaultRanks: IGuildRank[] = [
    {
        Name: "/Lotus/Language/Game/Rank_Creator",
        Permissions: 16351
    },
    {
        Name: "/Lotus/Language/Game/Rank_Warlord",
        Permissions: 16351
    },
    {
        Name: "/Lotus/Language/Game/Rank_General",
        Permissions: 4318
    },
    {
        Name: "/Lotus/Language/Game/Rank_Officer",
        Permissions: 4314
    },
    {
        Name: "/Lotus/Language/Game/Rank_Leader",
        Permissions: 4106
    },
    {
        Name: "/Lotus/Language/Game/Rank_Sage",
        Permissions: 4304
    },
    {
        Name: "/Lotus/Language/Game/Rank_Soldier",
        Permissions: 4098
    },
    {
        Name: "/Lotus/Language/Game/Rank_Initiate",
        Permissions: 4096
    },
    {
        Name: "/Lotus/Language/Game/Rank_Utility",
        Permissions: 4096
    }
];

const guildLogRoomChangeSchema = new Schema<IGuildLogRoomChange>(
    {
        dateTime: Date,
        entryType: Number,
        details: String,
        componentId: Types.ObjectId
    },
    { _id: false }
);

const guildLogEntryContributableSchema = new Schema<IGuildLogEntryContributable>(
    {
        dateTime: Date,
        entryType: Number,
        details: String
    },
    { _id: false }
);

const guildLogEntryRosterSchema = new Schema<IGuildLogEntryRoster>(
    {
        dateTime: Date,
        entryType: Number,
        details: String
    },
    { _id: false }
);

const guildLogEntryNumberSchema = new Schema<IGuildLogEntryNumber>(
    {
        dateTime: Date,
        entryType: Number,
        details: Number
    },
    { _id: false }
);

const guildSchema = new Schema<IGuildDatabase>(
    {
        Name: { type: String, required: true, unique: true },
        MOTD: { type: String, default: "" },
        LongMOTD: { type: longMOTDSchema, default: undefined },
        Ranks: { type: [guildRankSchema], default: defaultRanks },
        TradeTax: { type: Number, default: 0 },
        Tier: { type: Number, default: 1 },
        DojoComponents: { type: [dojoComponentSchema], default: [] },
        DojoCapacity: { type: Number, default: 100 },
        DojoEnergy: { type: Number, default: 5 },
        VaultRegularCredits: Number,
        VaultPremiumCredits: Number,
        VaultMiscItems: { type: [typeCountSchema], default: undefined },
        VaultShipDecorations: { type: [typeCountSchema], default: undefined },
        VaultFusionTreasures: { type: [fusionTreasuresSchema], default: undefined },
        TechProjects: { type: [techProjectSchema], default: undefined },
        ActiveDojoColorResearch: { type: String, default: "" },
        Class: { type: Number, default: 0 },
        XP: { type: Number, default: 0 },
        ClaimedXP: { type: [String], default: undefined },
        CeremonyClass: Number,
        CeremonyContributors: { type: [Types.ObjectId], default: undefined },
        CeremonyResetDate: Date,
        CeremonyEndo: Number,
        RoomChanges: { type: [guildLogRoomChangeSchema], default: undefined },
        TechChanges: { type: [guildLogEntryContributableSchema], default: undefined },
        RosterActivity: { type: [guildLogEntryRosterSchema], default: undefined },
        ClassChanges: { type: [guildLogEntryNumberSchema], default: undefined }
    },
    { id: false }
);

type GuildDocumentProps = {
    DojoComponents: Types.DocumentArray<IDojoComponentDatabase>;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type GuildModel = Model<IGuildDatabase, {}, GuildDocumentProps>;

export const Guild = model<IGuildDatabase, GuildModel>("Guild", guildSchema);

// eslint-disable-next-line @typescript-eslint/ban-types
export type TGuildDatabaseDocument = Document<unknown, {}, IGuildDatabase> &
    Omit<
        IGuildDatabase & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        },
        keyof GuildDocumentProps
    > &
    GuildDocumentProps;

const guildMemberSchema = new Schema<IGuildMemberDatabase>({
    accountId: Types.ObjectId,
    guildId: Types.ObjectId,
    status: { type: Number, required: true },
    rank: { type: Number, default: 7 }
});

guildMemberSchema.index({ accountId: 1, guildId: 1 }, { unique: true });

export const GuildMember = model<IGuildMemberDatabase>("GuildMember", guildMemberSchema);
