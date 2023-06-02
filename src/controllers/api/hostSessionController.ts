import { RequestHandler } from "express";

const hostSessionController: RequestHandler = (_req, res) => {
    res.json({ sessionId: { $oid: "64777916e794cfc5abdd69ea" }, rewardSeed: -1492798783199571432 });
};

export { hostSessionController };
