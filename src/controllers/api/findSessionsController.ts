import { RequestHandler } from "express";
import { getSession } from "@/src/managers/sessionManager";
import { logger } from "@/src/utils/logger";
import { IFindSessionRequest } from "@/src/types/session";

export const findSessionsController: RequestHandler = (_req, res) => {
    const req = JSON.parse(String(_req.body)) as IFindSessionRequest;
    logger.debug("FindSession Request ", req);
    if (req.id != undefined) {
        logger.debug("Found ID");
        const session = getSession(req.id);

        if (session) res.json({ queryId: req.queryId, Sessions: session });
        else res.json({});
    } else if (req.originalSessionId != undefined) {
        logger.debug("Found OriginalSessionID");

        const session = getSession(req.originalSessionId);
        if (session) res.json({ queryId: req.queryId, Sessions: session });
        else res.json({});
    } else {
        logger.debug("Found SessionRequest");

        const session = getSession(req);
        if (session) res.json({ queryId: req.queryId, Sessions: session });
        else res.json({});
    }
};
