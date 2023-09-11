import { RequestHandler } from "express";
import config from "@/config.json";
import worldState from "@/static/fixed_responses/worldState.json";

const worldStateController: RequestHandler = (_req, res) => {
    res.json(worldState);
};

export { worldStateController };
