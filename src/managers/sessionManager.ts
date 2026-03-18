import { generateRewardSeed } from "../services/rngService.ts";
import { Platform } from "../types/loginTypes.ts";
import type {
    ISession,
    IFindSessionRequest,
    IFindSessionResponseSession,
    IHostSessionRequest
} from "../types/session.ts";
import { logger } from "../utils/logger.ts";
import { JSONParse } from "json-with-bigint";
import { Types } from "mongoose";

const sessions: ISession[] = [];

function createNewSession(sessionData: IHostSessionRequest, Creator: Types.ObjectId): ISession {
    const sessionId = new Types.ObjectId();
    const newSession: ISession = {
        sessionId,
        creatorId: Creator,
        maxPlayers: sessionData.maxPlayers, // || 4
        minPlayers: sessionData.minPlayers, // || 1
        privateSlots: sessionData.privateSlots, // || 0
        scoreLimit: sessionData.scoreLimit, // || 15
        timeLimit: sessionData.timeLimit, // || 900
        gameModeId: sessionData.gameModeId, // || 0
        eloRating: sessionData.eloRating, // || 3
        regionId: sessionData.regionId, // || 3
        difficulty: sessionData.difficulty, // || 0
        hasStarted: sessionData.hasStarted, // || false
        enableVoice: sessionData.enableVoice, // || true
        matchType: sessionData.matchType, // || "NORMAL"
        maps: sessionData.maps, // || []
        originalSessionId: sessionData.originalSessionId, // || ""
        customSettings: sessionData.customSettings, // || ""
        rewardSeed: sessionData.rewardSeed || -1,
        guildId: sessionData.guildId, // || ""
        buildId: sessionData.buildId, // || 4920386201513015989n
        platform: sessionData.platform ?? Platform.Windows,
        xplatform: sessionData.xplatform ?? false,
        freePublic: sessionData.freePublic, // || 3
        freePrivate: sessionData.freePrivate, // || 0
        fullReset: 0
    };
    if (newSession.rewardSeed == -1) {
        newSession.rewardSeed = generateRewardSeed();
    }
    sessions.push(newSession);
    return newSession;
}

function getAllSessions(): ISession[] {
    return sessions;
}

function getSessionByID(sessionId: string | Types.ObjectId): ISession | undefined {
    return sessions.find(session => session.sessionId.equals(sessionId));
}

function getSession(request: IFindSessionRequest): IFindSessionResponseSession[] {
    return sessions
        .filter(session => {
            if ("id" in request) {
                return session.sessionId.equals(request.id);
            } else if ("originalSessionId" in request) {
                return session.sessionId.equals(request.originalSessionId);
            } else {
                return (
                    !session.hasStarted &&
                    request.buildId == session.buildId &&
                    request.gameModeId == session.gameModeId &&
                    (!request.freePublic || session.freePublic >= 1) &&
                    session.regionId == request.regionId &&
                    Math.abs(session.eloRating - request.eloRating) <= request.maxEloDifference &&
                    (!request.maps || session.maps.indexOf(request.maps) != -1)
                );
            }
        })
        .map(session => ({
            createdBy: session.creatorId.toString(),
            id: session.sessionId.toString()
        }));
}

function getSessionByCreatorID(creatorId: string | Types.ObjectId): ISession | undefined {
    return sessions.find(session => session.creatorId.equals(creatorId));
}

function updateSession(sessionId: string | Types.ObjectId, updateData: string): boolean {
    logger.debug(`session update: ${updateData}`);
    const session = sessions.find(session => session.sessionId.equals(sessionId));
    if (!session) {
        return false;
    }
    if (updateData.substring(0, 1) == "{") {
        try {
            Object.assign(session, JSONParse(updateData));
        } catch (error) {
            logger.error("Invalid JSON string for session update.");
            return false;
        }
    } else {
        const updates: string[] = updateData.split("&");
        for (const update of updates) {
            const arr = update.split("=");
            if (arr.length == 2) {
                const [key, value] = arr;
                switch (key) {
                    case "maxPlayers":
                    case "minPlayers":
                    case "privateSlots":
                    case "scoreLimit":
                    case "timeLimit":
                    case "gameModeId":
                    case "eloRating":
                    case "regionId":
                    case "difficulty":
                    case "freePublic":
                    case "freePrivate":
                        session[key] = parseInt(value);
                        break;

                    default:
                        logger.error(`unexpected key in legacy session update format: ${key}`);
                        break;
                }
            }
        }
    }
    //logger.debug(`session after update:`, session);
    return true;
}

function deleteSession(sessionId: string | Types.ObjectId): boolean {
    const index = sessions.findIndex(session => session.sessionId.equals(sessionId));
    if (index !== -1) {
        sessions.splice(index, 1);
        return true;
    }
    return false;
}

export {
    createNewSession,
    getAllSessions,
    getSessionByID,
    getSessionByCreatorID,
    updateSession,
    deleteSession,
    getSession
};
