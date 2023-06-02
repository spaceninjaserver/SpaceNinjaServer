import { RequestHandler } from "express";
import aggregateSessions from "@/static/fixed_responses/aggregateSessions.json";

const aggregateSessionsController: RequestHandler = (_req, res) => {
    res.json(aggregateSessions);
};

export { aggregateSessionsController };
