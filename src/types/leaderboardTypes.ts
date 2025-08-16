import { Types } from "mongoose";

export interface ILeaderboardEntryDatabase {
    leaderboard: string;
    ownerId: Types.ObjectId;
    displayName: string;
    score: number;
    guildId?: Types.ObjectId;
    expiry?: Date;
    guildTier?: number;
}

export interface ILeaderboardEntryClient {
    _id: string; // owner id
    s: number; // score
    r: number; // rank
    n: string; // displayName
}
