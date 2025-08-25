import type { RequestHandler } from "express";
import { getSessionByID } from "@/src/managers/sessionManager";
import { logger } from "@/src/utils/logger";

export const joinSessionController: RequestHandler = (req, res) => {
    const reqBody = JSON.parse(String(req.body)) as IJoinSessionRequest;
    logger.debug(`JoinSession Request`, { reqBody });
    const session = getSessionByID(reqBody.sessionIds[0]);
    res.json({ rewardSeed: session?.rewardSeed, sessionId: { $oid: session?.sessionId } });
};

interface IJoinSessionRequest {
    sessionIds: string[];
}
