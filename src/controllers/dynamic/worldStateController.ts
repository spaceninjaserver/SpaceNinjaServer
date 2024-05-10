import { RequestHandler } from "express";
import worldState from "@/static/fixed_responses/worldState.json";
import config from "@/config.json";

const worldStateController: RequestHandler = (_req, res) => {
    res.json({
        ...worldState,
        BuildLabel: config.buildLabel,
        Time: Math.round(Date.now() / 1000)
    });
};

export { worldStateController };
