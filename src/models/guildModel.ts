import { IGuild, IDatabaseGuild } from "@/src/types/guildTypes";
import { model, Schema } from "mongoose";
import { toOid } from "@/src/helpers/inventoryHelpers";

const guildSchema = new Schema<IGuild>({
    Name: { type: String, required: true }
});

guildSchema.set("toJSON", {
    virtuals: true,
    transform(_document, guild) {
        guild._id = toOid(guild._id);
    }
});

export const Guild = model<IGuild>("Guild", guildSchema);
