import { Session } from "../models/sessionModel.ts";
import { generateRewardSeed } from "./rngService.ts";
import type {
    ISession,
    IFindSessionRequest,
    IFindSessionResponseSession,
    IHostSessionRequest,
    ISessionDatabase
} from "../types/sessionTypes.ts";
import { logger } from "../utils/logger.ts";
import { JSONParse } from "json-with-bigint";
import { Types, type QueryFilter } from "mongoose";

//const sessions: ISession[] = [];

export const createNewSession = async (
    sessionData: IHostSessionRequest,
    Creator: Types.ObjectId
): Promise<ISession> => {
    const newSession: ISessionDatabase = {
        _id: new Types.ObjectId(),
        ...sessionData,
        creatorId: Creator,
        //maxPlayers: sessionData.maxPlayers ?? 4,
        //minPlayers: sessionData.minPlayers ?? 1,
        //privateSlots: sessionData.privateSlots ?? 0,
        //scoreLimit: sessionData.scoreLimit ?? 15,
        //timeLimit: sessionData.timeLimit ?? 900,
        //gameModeId: sessionData.gameModeId ?? 0,
        //eloRating: sessionData.eloRating ?? 3,
        //regionId: sessionData.regionId ?? 3,
        //difficulty: sessionData.difficulty ?? 0,
        hasStarted: sessionData.hasStarted ?? false,
        //enableVoice: sessionData.enableVoice ?? true,
        //matchType: sessionData.matchType ?? "NORMAL",
        //maps: sessionData.maps ?? [],
        //originalSessionId: sessionData.originalSessionId ?? "",
        //customSettings: sessionData.customSettings ?? "",
        rewardSeed: sessionData.rewardSeed || -1,
        //guildId: sessionData.guildId ?? "",
        //buildId: sessionData.buildId ?? 4920386201513015989n,
        //platform: sessionData.platform ?? Platform.Windows,
        //xplatform: sessionData.xplatform ?? false,
        //freePublic: sessionData.freePublic ?? 3,
        //freePrivate: sessionData.freePrivate ?? 0,
        fullReset: 0,

        lastUpdate: new Date()
    };
    if (newSession.rewardSeed == -1) {
        newSession.rewardSeed = generateRewardSeed();
    }

    await Session.create(newSession);
    //sessions.push(newSession);

    return newSession;
};

export const getSessionByID = async (sessionId: string | Types.ObjectId): Promise<ISessionDatabase | null> => {
    return await Session.findById(sessionId);
};

export const getSession = async (request: IFindSessionRequest): Promise<IFindSessionResponseSession[]> => {
    const query: QueryFilter<ISessionDatabase> = {};
    if ("id" in request) {
        query._id = request.id;
    } else if ("originalSessionId" in request) {
        query.originalSessionId = request.originalSessionId;
    } else {
        query.hasStarted = false;
        query.buildId = request.buildId;
        query.gameModeId = request.gameModeId;
        if (request.freePublic) {
            query.freePublic = { $gte: 1 };
        }
        query.regionId = request.regionId;
        if (request.eloRating !== undefined && request.maxEloDifference !== undefined) {
            query.eloRating = {
                $gte: request.eloRating - request.maxEloDifference,
                $lte: request.eloRating + request.maxEloDifference
            };
        }
        if (request.maps) {
            query.maps = request.maps;
        }
    }
    return (await Session.find(query, "creatorId")).map(session => ({
        createdBy: session.creatorId.toString(),
        id: session._id.toString()
    }));

    /*return sessions
        .filter(session => {
            if ("id" in request) {
                return session._id.equals(request.id);
            } else if ("originalSessionId" in request) {
                return session._id.equals(request.originalSessionId);
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
            id: session._id.toString()
        }));*/
};

export const updateSession = async (
    sessionId: string | Types.ObjectId,
    updateData: string | undefined
): Promise<boolean> => {
    //const session = sessions.find(session => session._id.equals(sessionId));
    const session = await Session.findById(sessionId);
    if (!session) {
        return false;
    }

    if (updateData) {
        logger.debug(`session update: ${updateData}`);
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
    }

    session.lastUpdate = new Date();
    //logger.debug(`session after update:`, session);
    await session.save();

    return true;
};

export const deleteSession = async (sessionId: string | Types.ObjectId): Promise<void> => {
    await Session.deleteOne({ _id: sessionId });

    /*const index = sessions.findIndex(session => session._id.equals(sessionId));
    if (index !== -1) {
        sessions.splice(index, 1);
    }*/
};

export const aggregateSessions = (): Promise<{ gameModeId: number; count: number }[]> => {
    return Session.aggregate([
        {
            $match: {
                freePublic: { $ne: 0 }
            }
        },
        {
            $group: {
                _id: "$gameModeId",
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                gameModeId: "$_id",
                count: 1
            }
        }
    ]);

    /*const result: { gameModeId: number; count: number }[] = [];
    for (const session of sessions) {
        if (session.freePublic != 0) {
            const obj = result.find(x => x.gameModeId == session.gameModeId);
            if (obj) {
                obj.count += 1;
            } else {
                result.push({ gameModeId: session.gameModeId, count: 1 });
            }
        }
    }
    return result;*/
};
