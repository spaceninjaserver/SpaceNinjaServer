import { IGuildDatabase, IDojoComponentDatabase } from "@/src/types/guildTypes";
import { model, Schema } from "mongoose";
import { toOid } from "@/src/helpers/inventoryHelpers";

const dojoComponentSchema = new Schema<IDojoComponentDatabase>({
    pf: { type: String, required: true },
    ppf: String,
    CompletionTime: Date
});

const guildSchema = new Schema<IGuildDatabase>(
    {
        Name: { type: String, required: true },
        DojoComponents: [dojoComponentSchema]
    },
    { id: false }
);

guildSchema.set("toJSON", {
    virtuals: true,
    transform(_document, guild) {
        guild._id = toOid(guild._id);
        delete guild.__v;
    }
});

export const Guild = model<IGuildDatabase>("Guild", guildSchema);
