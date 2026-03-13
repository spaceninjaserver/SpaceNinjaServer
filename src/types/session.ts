import type { Types } from "mongoose";

export interface IHostSessionRequest {
    maxPlayers: number;
    minPlayers: number;
    privateSlots: number;
    scoreLimit: number;
    timeLimit: number;
    gameModeId: number;
    eloRating: number;
    regionId: number;
    difficulty: number;
    hasStarted: boolean;
    enableVoice: boolean;
    matchType: string;
    maps: string[];
    originalSessionId: string;
    customSettings: string;
    rewardSeed?: number | bigint;
    guildId: string;
    buildId: number | bigint;
    platform?: number;
    xplatform?: boolean;
    freePublic: number;
    freePrivate: number;
    fullReset: number;
}

export interface ISession extends Omit<IHostSessionRequest, "rewardSeed" | "platform" | "xplatform"> {
    sessionId: Types.ObjectId;
    creatorId: Types.ObjectId;
    rewardSeed: number | bigint;
    platform: number;
    xplatform: boolean;
}

export type IFindSessionRequest = { queryId: number } & (
    | {
          id: string;
      }
    | {
          originalSessionId: string;
      }
    | {
          buildId: number | bigint;
          gameModeId: number;
          maps: string;
          regionId: number;
          maxEloDifference: number;
          eloRating: number;
          enforceElo: boolean;
          xplatform: boolean;
      }
);

export interface IFindSessionResponse {
    queryId: number;
    Sesions: IFindSessionResponseSession[];
}

export interface IFindSessionResponseSession {
    createdBy: string;
    id: string;
}
