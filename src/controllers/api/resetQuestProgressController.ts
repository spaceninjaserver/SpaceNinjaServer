import type { RequestHandler } from "express";

export const resetQuestProgressController: RequestHandler = (_req, res) => {
    res.send("1").end();
};
