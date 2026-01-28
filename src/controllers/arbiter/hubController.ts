import type { RequestHandler } from "express";
import { config, getReflexiveAddress } from "../../services/configService.ts";

export const hubController: RequestHandler = (req, res) => {
    if (config.noHubDiscrimination) {
        const arr = (req.query.level as string).split("_");
        const instanceId = arr.pop();
        const level = arr[0];
        res.json(`hub ${config.hubAddress ?? getReflexiveAddress(req).myAddress}:6952 ${instanceId} ${level}`);
    } else {
        res.json(`hub ${config.hubAddress ?? getReflexiveAddress(req).myAddress}:6952`);
    }
};
