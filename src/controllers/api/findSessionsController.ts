import { RequestHandler } from "express";
import { getSession } from "@/src/managers/sessionManager";
import { FindSessionRequest } from "@/src/types/session";

const findSessionsController: RequestHandler = (_req, res) => {
    const sessionRequest = JSON.parse(String(_req.body)) as FindSessionRequest;
    if (sessionRequest.id != undefined) {
        const session = getSession(sessionRequest.id);

        if (session) {
            return res.json({ queryId: sessionRequest.queryId, Sessions: session });
        }
        return res.json({});
    } else if (sessionRequest.originalSessionId != undefined) {
        const session = getSession(sessionRequest.originalSessionId);
        if (session) {
            return res.json({ queryId: sessionRequest.queryId, Sessions: session });
        }
        return res.json({});
    }

    const session = getSession(sessionRequest);
    if (session) {
        return res.json({ queryId: sessionRequest.queryId, Sessions: session });
    }
    return res.json({});
};

export { findSessionsController };
