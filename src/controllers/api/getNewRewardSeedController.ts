import { RequestHandler } from "express";

const getNewRewardSeedController: RequestHandler = (_req, res) => {
    res.json({ rewardSeed: 1111111111 });
};

function generateRewardSeed(): number {
    const min = -Number.MAX_SAFE_INTEGER;
    const max = Number.MAX_SAFE_INTEGER;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

export { getNewRewardSeedController };
