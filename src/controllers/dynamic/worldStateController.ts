import { RequestHandler } from "express";
import worldState from "@/static/fixed_responses/worldState.json";
import buildConfig from "@/static/data/buildConfig.json";

const worldStateController: RequestHandler = (req, res) => {
    const buildLabel: string =
        typeof req.query.buildLabel == "string" ? req.query.buildLabel.split(" ").join("+") : buildConfig.buildLabel;

    res.json({
        ...worldState,
        BuildLabel: buildLabel,
        Time: Math.round(Date.now() / 1000)
    });
};

export { worldStateController };
