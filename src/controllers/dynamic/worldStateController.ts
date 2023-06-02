import { RequestHandler } from "express";
import config from "@/config.json";
import worldState from "@/static/fixed_responses/worldState.json";

const worldStateController: RequestHandler = (_req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    worldState.WorldSeed = config.worldSeed;
    worldState.BuildLabel = config.buildLabel;
    res.json(worldState);
};

export { worldStateController };
