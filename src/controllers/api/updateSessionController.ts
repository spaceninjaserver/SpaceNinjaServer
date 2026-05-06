import type { RequestHandler } from "express";
import { updateSession } from "../../services/sessionService.ts";

export const updateSessionController: RequestHandler = async (req, res) => {
    if (!(await updateSession(req.query.sessionId as string, String(req.body)))) {
        res.status(400);
    }
    res.json({});
};
