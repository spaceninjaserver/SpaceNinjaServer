import {
    IGuildDatabase,
    IDojoComponentDatabase,
    ITechProjectDatabase,
    ITechProjectClient
} from "@/src/types/guildTypes";
import { model, Schema } from "mongoose";
import { typeCountSchema } from "./inventoryModels/inventoryModel";
import { toMongoDate } from "../helpers/inventoryHelpers";

const dojoComponentSchema = new Schema<IDojoComponentDatabase>({
    pf: { type: String, required: true },
    ppf: String,
    pi: Schema.Types.ObjectId,
    op: String,
    pp: String,
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
        DojoComponents: [dojoComponentSchema],
        DojoCapacity: { type: Number, default: 100 },
        DojoEnergy: { type: Number, default: 5 },
        TechProjects: { type: [techProjectSchema], default: undefined }
    },
    { id: false }
);

export const Guild = model<IGuildDatabase>("Guild", guildSchema);
