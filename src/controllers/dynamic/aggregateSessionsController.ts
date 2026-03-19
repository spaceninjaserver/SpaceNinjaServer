import type { RequestHandler } from "express";
import { aggregateSessions } from "../../managers/sessionManager.ts";

export const aggregateSessionsController: RequestHandler = (_req, res) => {
    res.json({
        Results: aggregateSessions()
    } satisfies IAggregateSessionsResponse);
};

interface IAggregateSessionsResponse {
    Results: {
        gameModeId: number;
        count: number;
    }[];
}
