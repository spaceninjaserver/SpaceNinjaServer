import type { RequestHandler } from "express";
import { config, getReflexiveAddress } from "../../services/configService.ts";

export const hubController: RequestHandler = (req, res) => {
    res.json(`hub ${config.hubAddress ?? getReflexiveAddress(req).myAddress}:6952`);
};
