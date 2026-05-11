import type { Types } from "mongoose";
import type { TPlatform } from "./loginTypes.ts";

export interface IHostSessionRequest {
    maxPlayers: number;
    minPlayers: number;
    privateSlots: number;
    scoreLimit: number;
    timeLimit: number;
    gameModeId: number;
    eloRating?: number;
    regionId: number;
    difficulty: number;
    hasStarted?: boolean;
    enableVoice?: boolean;
    matchType: string;
    maps: string[];
    originalSessionId: string;
    customSettings?: string;
    rewardSeed?: number | bigint;
    guildId?: string;
    buildId: number | bigint;
    platform?: TPlatform;
    xplatform?: boolean;
    freePublic: number;
    freePrivate: number;
    fullReset?: number;
}

export interface ISession extends Omit<IHostSessionRequest, "hasStarted" | "rewardSeed"> {
    _id: Types.ObjectId;
    creatorId: Types.ObjectId;

    hasStarted: boolean;
    rewardSeed: number | bigint;
}

export interface ISessionDatabase extends ISession {
    lastUpdate: Date;
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
          freePublic?: { $gte: 1 };
          maps?: string;
          regionId: number;
          maxEloDifference?: number;
          eloRating?: number;
          enforceElo?: boolean;
          allowLobby?: boolean; // for conclave
          platform?: TPlatform;
          xplatform?: boolean;
      }
);

export interface IFindSessionResponse {
    queryId: number;
    Sessions: IFindSessionResponseSession[];
}

export interface IFindSessionResponseSession {
    createdBy: string;
    id: string;
}
