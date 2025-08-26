import type { RequestHandler } from "express";
import aggregateSessions from "../../../static/fixed_responses/aggregateSessions.json" with { type: "json" };

const aggregateSessionsController: RequestHandler = (_req, res) => {
    res.json(aggregateSessions);
};

export { aggregateSessionsController };
