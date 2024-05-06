import { RequestHandler } from "express";
import worldState from "@/static/fixed_responses/worldState.json";

const worldStateController: RequestHandler = (_req, res) => {
    const state = worldState;
    state.Time = Math.round(Date.now() / 1000);
    res.json(state);
};

export { worldStateController };
