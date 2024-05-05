import { RequestHandler } from "express";
import { getSessionByID } from "@/src/managers/sessionManager";
import { logger } from "@/src/utils/logger";

const joinSessionController: RequestHandler = (_req, res) => {
    const reqBody = JSON.parse(_req.body);
    logger.debug(`JoinSession Request`, { reqBody });
    const req = JSON.parse(_req.body);
    const session = getSessionByID(req.sessionIds[0]);
    res.json({ rewardSeed: session?.rewardSeed, sessionId: { $oid: session?.sessionId } });
};

export { joinSessionController };
