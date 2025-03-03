import {
    IGuildDatabase,
    IDojoComponentDatabase,
    ITechProjectDatabase,
    ITechProjectClient
} from "@/src/types/guildTypes";
import { Document, Model, model, Schema, Types } from "mongoose";
import { typeCountSchema } from "./inventoryModels/inventoryModel";
import { toMongoDate } from "../helpers/inventoryHelpers";

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
    CompletionTime: Date
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

const guildSchema = new Schema<IGuildDatabase>(
    {
        Name: { type: String, required: true },
        DojoComponents: { type: [dojoComponentSchema], default: [] },
        DojoCapacity: { type: Number, default: 100 },
        DojoEnergy: { type: Number, default: 5 },
        TechProjects: { type: [techProjectSchema], default: undefined }
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
