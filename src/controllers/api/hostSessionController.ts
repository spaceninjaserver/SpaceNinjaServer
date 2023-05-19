import { RequestHandler } from "express";
const hostSessionController: RequestHandler = (_req, res) => {
  res.json({ sessionId: { $oid: "123123123" }, rewardSeed: 123123123123 });
};

export { hostSessionController };
