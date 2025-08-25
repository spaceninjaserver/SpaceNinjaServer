import type { RequestHandler } from "express";

// example req.body: {"NewEpisodeReward":true,"crossPlaySetting":"ENABLED"}
export const clearNewEpisodeRewardController: RequestHandler = (_req, res) => {
    res.status(200).end();
};
