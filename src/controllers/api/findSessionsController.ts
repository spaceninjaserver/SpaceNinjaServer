import { RequestHandler } from "express";
import { getSession } from "@/src/managers/sessionManager";
import { logger } from "@/src/utils/logger";

//TODO: cleanup
const findSessionsController: RequestHandler = (_req, res) => {
    const reqBody = JSON.parse(_req.body);
    logger.debug("FindSession Request ", { reqBody });
    let req = JSON.parse(_req.body);
    if (req.id != undefined) {
        logger.debug("Found ID");
        let session = getSession(req.id);

        if (session) res.json({ queryId: req.queryId, Sessions: session });
        else res.json({});
    } else if (req.originalSessionId != undefined) {
        logger.debug("Found OriginalSessionID");

        let session = getSession(req.originalSessionId);
        if (session) res.json({ queryId: req.queryId, Sessions: session });
        else res.json({});
    } else {
        logger.debug("Found SessionRequest");

        let session = getSession(_req.body);
        if (session) res.json({ queryId: req.queryId, Sessions: session });
        else res.json({});
    }
};

export { findSessionsController };
