import type { RequestHandler } from "express";
import { deleteSession } from "@/src/managers/sessionManager";

const deleteSessionController: RequestHandler = (_req, res) => {
    deleteSession(_req.query.sessionId as string);
    res.sendStatus(200);
};

export { deleteSessionController };
