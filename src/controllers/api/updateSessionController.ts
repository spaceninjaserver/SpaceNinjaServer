import { RequestHandler } from "express";
import { updateSession } from "@/src/managers/sessionManager";
import { logger } from "@/src/utils/logger";

const updateSessionGetController: RequestHandler = (_req, res) => {
    res.json({});
};
const updateSessionPostController: RequestHandler = (_req, res) => {
    console.log("UpdateSessions POST Request:", JSON.parse(_req.body));
    console.log("ReqID:", _req.query.sessionId as string);
    updateSession(_req.query.sessionId as string, _req.body);
    res.json({});
};
export { updateSessionGetController, updateSessionPostController };
