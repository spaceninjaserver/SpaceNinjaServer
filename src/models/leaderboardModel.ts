import { Document, model, Schema, Types } from "mongoose";
import { ILeaderboardEntryDatabase } from "@/src/types/leaderboardTypes";

const leaderboardEntrySchema = new Schema<ILeaderboardEntryDatabase>(
    {
        leaderboard: { type: String, required: true },
        ownerId: { type: Schema.Types.ObjectId, required: true },
        displayName: { type: String, required: true },
        score: { type: Number, required: true },
        guildId: Schema.Types.ObjectId,
        expiry: Date,
        guildTier: Number
    },
    { id: false }
);

leaderboardEntrySchema.index({ leaderboard: 1 });
leaderboardEntrySchema.index({ leaderboard: 1, ownerId: 1 }, { unique: true });
leaderboardEntrySchema.index({ expiry: 1 }, { expireAfterSeconds: 0 }); // With this, MongoDB will automatically delete expired entries.

export const Leaderboard = model<ILeaderboardEntryDatabase>("Leaderboard", leaderboardEntrySchema);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TLeaderboardEntryDocument = Document<unknown, {}, ILeaderboardEntryDatabase> & {
    _id: Types.ObjectId;
    __v: number;
} & ILeaderboardEntryDatabase;
