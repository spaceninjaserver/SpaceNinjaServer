import type { RequestHandler } from "express";
import { hubInstances, type IHubInstance } from "../../services/arbiterService.ts";

export const hubDroppedController: RequestHandler = (req, res) => {
    const level = hubInstances[req.query.level as string] as IHubInstance | undefined;
    if (level) {
        level.Players = Math.max(0, level.Players - 1);
    }
    res.end();
};
