import type { RequestHandler } from "express";
import { updateSession } from "../../managers/sessionManager.ts";

const updateSessionGetController: RequestHandler = (_req, res) => {
    res.json({});
};
const updateSessionPostController: RequestHandler = (_req, res) => {
    //console.log("UpdateSessions POST Request:", JSON.parse(String(_req.body)));
    //console.log("ReqID:", _req.query.sessionId as string);
    if (!updateSession(_req.query.sessionId as string, String(_req.body))) {
        res.status(400);
    }
    res.json({});
};
export { updateSessionGetController, updateSessionPostController };
