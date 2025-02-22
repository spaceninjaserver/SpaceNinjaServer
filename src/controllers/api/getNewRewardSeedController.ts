import { RequestHandler } from "express";

export const getNewRewardSeedController: RequestHandler = (_req, res) => {
    res.json({ rewardSeed: generateRewardSeed() });
};

export function generateRewardSeed(): number {
    const min = -Number.MAX_SAFE_INTEGER;
    const max = Number.MAX_SAFE_INTEGER;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
