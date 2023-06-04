import { Session, FindSessionRequest } from "@/src/types/session";

const sessions: Session[] = [];

function createNewSession(sessionData: Session, Creator: string): Session {
    const sessionId = getNewSessionID();
    const newSession: Session = {
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
        buildId: sessionData.buildId || 4920386201513015989,
        platform: sessionData.platform || 0,
        xplatform: sessionData.xplatform || true,
        freePublic: sessionData.freePublic || 3,
        freePrivate: sessionData.freePrivate || 0,
        fullReset: 0
    };
    sessions.push(newSession);
    return newSession;
}

function getAllSessions(): Session[] {
    return sessions;
}

function getSessionByID(sessionId: string): Session | undefined {
    return sessions.find(session => session.sessionId === sessionId);
}

function getSession(sessionIdOrRequest: string | FindSessionRequest): any[] {
    if (typeof sessionIdOrRequest === "string") {
        const session = sessions.find(session => session.sessionId === sessionIdOrRequest);
        if (session) {
            console.log("Found Sessions:", session);
            return [
                {
                    createdBy: session.creatorId,
                    id: session.sessionId
                }
            ];
        }
        return [];
    }

    const request = sessionIdOrRequest as FindSessionRequest;
    const matchingSessions = sessions.filter(session => {
        for (const key in request) {
            if (key !== "eloRating" && key !== "queryId" && request[key] !== session[key as keyof Session]) {
                return false;
            }
        }
        console.log("Found Matching Sessions:", matchingSessions);
        return true;
    });
    return matchingSessions.map(session => ({
        createdBy: session.creatorId,
        id: session.sessionId
    }));
}

function getSessionByCreatorID(creatorId: string): Session | undefined {
    return sessions.find(session => session.creatorId === creatorId);
}

function getNewSessionID(): string {
    const characters = "0123456789abcdef";
    const maxAttempts = 100;
    let sessionId = "";

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        sessionId = "64";
        for (let i = 0; i < 22; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            sessionId += characters[randomIndex];
        }

        if (!sessions.some(session => session.sessionId === sessionId)) {
            return sessionId;
        }
    }

    throw new Error("Failed to generate a unique session ID");
}

function updateSession(sessionId: string, sessionData: string): boolean {
    const session = sessions.find(session => session.sessionId === sessionId);
    if (!session) return false;
    try {
        const updatedData = JSON.parse(sessionData);
        Object.assign(session, updatedData);
        return true;
    } catch (error) {
        console.error("Invalid JSON string for session update.");
        return false;
    }
}

function deleteSession(sessionId: string): boolean {
    const index = sessions.findIndex(session => session.sessionId === sessionId);
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
    getNewSessionID,
    updateSession,
    deleteSession,
    getSession
};
