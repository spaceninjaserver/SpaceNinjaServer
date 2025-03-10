import {
    IGuildDatabase,
    IDojoComponentDatabase,
    ITechProjectDatabase,
    ITechProjectClient,
    IDojoDecoDatabase,
    ILongMOTD,
    IGuildMemberDatabase
} from "@/src/types/guildTypes";
import { Document, Model, model, Schema, Types } from "mongoose";
import { fusionTreasuresSchema, typeCountSchema } from "./inventoryModels/inventoryModel";
import { toMongoDate } from "../helpers/inventoryHelpers";

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
    RushPlatinum: Number,
    DestructionTime: Date,
    Decos: [dojoDecoSchema],
    DecoCapacity: Number
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

techProjectSchema.set("toJSON", {
    virtuals: true,
    transform(_doc, obj) {
        const db = obj as ITechProjectDatabase;
        const client = obj as ITechProjectClient;
        if (db.CompletionDate) {
            client.CompletionDate = toMongoDate(db.CompletionDate);
        }
    }
});

const longMOTDSchema = new Schema<ILongMOTD>(
    {
        message: String,
        authorName: String
    },
    { _id: false }
);

const guildSchema = new Schema<IGuildDatabase>(
    {
        Name: { type: String, required: true, unique: true },
        MOTD: { type: String, default: "" },
        LongMOTD: { type: longMOTDSchema, default: undefined },
        DojoComponents: { type: [dojoComponentSchema], default: [] },
        DojoCapacity: { type: Number, default: 100 },
        DojoEnergy: { type: Number, default: 5 },
        VaultRegularCredits: Number,
        VaultPremiumCredits: Number,
        VaultMiscItems: { type: [typeCountSchema], default: undefined },
        VaultShipDecorations: { type: [typeCountSchema], default: undefined },
        VaultFusionTreasures: { type: [fusionTreasuresSchema], default: undefined },
        TechProjects: { type: [techProjectSchema], default: undefined },
        Class: { type: Number, default: 0 },
        XP: { type: Number, default: 0 },
        ClaimedXP: { type: [String], default: undefined },
        CeremonyClass: Number,
        CeremonyContributors: { type: [Types.ObjectId], default: undefined },
        CeremonyResetDate: Date,
        CeremonyEndo: Number
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
