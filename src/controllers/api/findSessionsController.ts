import type { RequestHandler } from "express";
import { getSession } from "../../managers/sessionManager.ts";
import { logger } from "../../utils/logger.ts";
import type { IFindSessionRequest } from "../../types/session.ts";

export const findSessionsController: RequestHandler = (_req, res) => {
    const req = JSON.parse(String(_req.body)) as IFindSessionRequest;
    logger.debug("FindSession Request ", req);
    if (req.id != undefined) {
        logger.debug("Found ID");
        const sessions = getSession(req.id);

        if (sessions.length) res.json({ queryId: req.queryId, Sessions: sessions });
        else res.json({});
    } else if (req.originalSessionId != undefined) {
        logger.debug("Found OriginalSessionID");

        const session = getSession(req.originalSessionId);
        if (session.length) res.json({ queryId: req.queryId, Sessions: session });
        else res.json({});
    } else {
        logger.debug("Found SessionRequest");

        const session = getSession(req);
        if (session.length) res.json({ queryId: req.queryId, Sessions: session });
        else res.json({});
    }
};
