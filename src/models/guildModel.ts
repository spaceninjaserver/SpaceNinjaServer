import { IGuildDatabase, IDojoComponentDatabase } from "@/src/types/guildTypes";
import { model, Schema } from "mongoose";

const dojoComponentSchema = new Schema<IDojoComponentDatabase>({
    pf: { type: String, required: true },
    ppf: String,
    pi: Schema.Types.ObjectId,
    op: String,
    pp: String,
    CompletionTime: Date
});

const guildSchema = new Schema<IGuildDatabase>(
    {
        Name: { type: String, required: true },
        DojoComponents: [dojoComponentSchema]
    },
    { id: false }
);

export const Guild = model<IGuildDatabase>("Guild", guildSchema);
