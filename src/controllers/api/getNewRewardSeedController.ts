import { RequestHandler } from "express";

const getNewRewardSeedController: RequestHandler = (_req, res) => {
    res.json({ rewardSeed: 5867309943877621023 });
};

export { getNewRewardSeedController };
