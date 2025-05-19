import { ISession, IFindSessionRequest } from "@/src/types/session";
import { logger } from "@/src/utils/logger";
import { JSONParse } from "json-with-bigint";
import { Types } from "mongoose";

const sessions: ISession[] = [];

function createNewSession(sessionData: ISession, Creator: Types.ObjectId): ISession {
    const sessionId = new Types.ObjectId();
    const newSession: ISession = {
        sessionId,
        creatorId: Creator,
        maxPlayers: sessionData.maxPlayers || 4,
        minPlayers: sessionData.minPlayers || 1,
        privateSlots: sessionData.privateSlots || 0,
        scoreLimit: sessionData.scoreLimit || 15,
        timeLimit: sessionData.timeLimit || 900,
        gameModeId: sessionData.gameModeId || 0,
        eloRating: sessionData.eloRating || 3,
        regionId: sessionData.regionId || 3,
        difficulty: sessionData.difficulty || 0,
        hasStarted: sessionData.hasStarted || false,
        enableVoice: sessionData.enableVoice || true,
        matchType: sessionData.matchType || "NORMAL",
        maps: sessionData.maps || [],
        originalSessionId: sessionData.originalSessionId || "",
        customSettings: sessionData.customSettings || "",
        rewardSeed: sessionData.rewardSeed || -1,
        guildId: sessionData.guildId || "",
        buildId: sessionData.buildId || 4920386201513015989n,
        platform: sessionData.platform || 0,
        xplatform: sessionData.xplatform || true,
        freePublic: sessionData.freePublic || 3,
        freePrivate: sessionData.freePrivate || 0,
        fullReset: 0
    };
    sessions.push(newSession);
    return newSession;
}

function getAllSessions(): ISession[] {
    return sessions;
}

function getSessionByID(sessionId: string | Types.ObjectId): ISession | undefined {
    return sessions.find(session => session.sessionId.equals(sessionId));
}

function getSession(
    sessionIdOrRequest: string | Types.ObjectId | IFindSessionRequest
): { createdBy: Types.ObjectId; id: Types.ObjectId }[] {
    if (typeof sessionIdOrRequest === "string" || sessionIdOrRequest instanceof Types.ObjectId) {
        const session = sessions.find(session => session.sessionId.equals(sessionIdOrRequest));
        if (session) {
            logger.debug("Found Sessions:", { session });
            return [
                {
                    createdBy: session.creatorId,
                    id: session.sessionId
                }
            ];
        }
        return [];
    }

    const request = sessionIdOrRequest;
    const matchingSessions = sessions.filter(session => {
        for (const key in request) {
            if (
                key !== "eloRating" &&
                key !== "queryId" &&
                request[key as keyof IFindSessionRequest] !== session[key as keyof ISession]
            ) {
                return false;
            }
        }
        logger.debug("Found Matching Sessions:", { matchingSessions });
        return true;
    });
    return matchingSessions.map(session => ({
        createdBy: session.creatorId,
        id: session.sessionId
    }));
}

function getSessionByCreatorID(creatorId: string | Types.ObjectId): ISession | undefined {
    return sessions.find(session => session.creatorId.equals(creatorId));
}

function updateSession(sessionId: string | Types.ObjectId, sessionData: string): boolean {
    const session = sessions.find(session => session.sessionId.equals(sessionId));
    if (!session) return false;
    try {
        Object.assign(session, JSONParse(sessionData));
        return true;
    } catch (error) {
        console.error("Invalid JSON string for session update.");
        return false;
    }
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
