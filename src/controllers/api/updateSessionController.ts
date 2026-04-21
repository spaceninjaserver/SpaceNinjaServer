import type { RequestHandler } from "express";
import { updateSession } from "../../services/sessionService.ts";

export const updateSessionGetController: RequestHandler = (_req, res) => {
    res.json({});
};

export const updateSessionPostController: RequestHandler = async (req, res) => {
    //console.log("UpdateSessions POST Request:", JSON.parse(String(_req.body)));
    //console.log("ReqID:", _req.query.sessionId as string);
    if (!(await updateSession(req.query.sessionId as string, String(req.body)))) {
        res.status(400);
    }
    res.json({});
};
