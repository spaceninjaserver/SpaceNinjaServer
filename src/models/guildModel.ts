import { IGuild } from "@/src/types/guildTypes";
import { model, Schema } from "mongoose";
import { toOid } from "@/src/helpers/inventoryHelpers";

const guildSchema = new Schema<IGuild>(
    {
        Name: { type: String, required: true }
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

export const Guild = model<IGuild>("Guild", guildSchema);
