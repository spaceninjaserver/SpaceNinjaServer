import type { RequestHandler } from "express";
import { getSession } from "../../managers/sessionManager.ts";
import { logger } from "../../utils/logger.ts";
import type { IFindSessionRequest } from "../../types/session.ts";

export const findSessionsController: RequestHandler = (_req, res) => {
    const req = JSON.parse(String(_req.body)) as IFindSessionRequest;
    logger.debug("FindSession Request:", req);
    const sessions = getSession(req);
    logger.debug("FindSession Result:", { sessions });
    if (sessions.length) res.json({ queryId: req.queryId, Sessions: sessions });
    else res.json({});
};
