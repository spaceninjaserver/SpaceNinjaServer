import { RequestHandler } from "express";
import { IStatsView } from "@/src/types/statTypes";
import config from "@/config.json";
import view from "@/static/fixed_responses/view.json";
import allScans from "@/static/fixed_responses/allScans.json";

const viewController: RequestHandler = (_req, res) => {
    let responseJson: IStatsView = view;
    if (config.unlockAllScans) {
        responseJson.Scans = allScans;
    }
    res.json(responseJson);
};

export { viewController };
