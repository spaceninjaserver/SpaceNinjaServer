import { IGuild, IDatabaseGuild } from "@/src/types/guildTypes";
import { model, Schema } from "mongoose";

const guildSchema = new Schema<IGuild>({
    Name: { type: String, required: true }
});

export const Guild = model<IGuild>("Guild", guildSchema);
