import { Types } from "mongoose";

export interface ISession {
    sessionId: Types.ObjectId;
    creatorId: Types.ObjectId;
    maxPlayers?: number;
    minPlayers?: number;
    privateSlots?: number;
    scoreLimit?: number;
    timeLimit?: number;
    gameModeId?: number;
    eloRating?: number;
    regionId?: number;
    difficulty?: number;
    hasStarted?: boolean;
    enableVoice?: boolean;
    matchType?: string;
    maps?: string[];
    originalSessionId?: string;
    customSettings?: string;
    rewardSeed?: number;
    guildId?: string;
    buildId?: number | bigint;
    platform?: number;
    xplatform?: boolean;
    freePublic?: number;
    freePrivate?: number;
    fullReset?: number;
}

export interface IFindSessionRequest {
    id?: string;
    originalSessionId?: string;
    buildId?: number;
    gameModeId?: number;
    regionId?: number;
    maxEloDifference?: number;
    eloRating?: number;
    enforceElo?: boolean;
    xplatform?: boolean;
    queryId?: number;
}
