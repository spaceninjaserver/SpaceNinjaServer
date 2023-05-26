import { RequestHandler } from "express";
import config from "@/config.json";
import worldState from "@/static/fixed_responses/worldState.json";

const worldStateController: RequestHandler = (_req, res) => {
    worldState.WorldSeed = config.WorldSeed;
    worldState.BuildLabel = config.buildLabel;
    res.json(worldState);
};

export { worldStateController };
