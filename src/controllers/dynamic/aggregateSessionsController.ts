import type { RequestHandler } from "express";
import { aggregateSessions } from "../../services/sessionService.ts";

export const aggregateSessionsController: RequestHandler = async (_req, res) => {
    res.json({
        Results: await aggregateSessions()
    } satisfies IAggregateSessionsResponse);
};

interface IAggregateSessionsResponse {
    Results: {
        gameModeId: number;
        count: number;
    }[];
}
