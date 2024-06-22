import { RequestHandler } from "express";
import worldState from "@/static/fixed_responses/worldState.json";
import buildConfig from "@/static/data/buildConfig.json";
import { config } from "@/src/services/configService";
import { getWorldState } from "@/src/services/worldStateService";

const worldStateController: RequestHandler = async (_req, res) => {
    let ws: { [k: string]: any } = {};
    if (config.useStaticWorldState) {
        ws = worldState;
        ws.BuildLabel = buildConfig.buildLabel;
        ws.Time = Math.round(Date.now() / 1000);
    } else {
        ws = await getWorldState();
        ws.BuildLabel = buildConfig.buildLabel;
        ws.Time = Math.round(Date.now() / 1000);
    }

    res.json(ws);
};

export { worldStateController };
