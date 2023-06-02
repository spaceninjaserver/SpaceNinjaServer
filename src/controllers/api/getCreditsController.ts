import { RequestHandler } from "express";

const getCreditsController: RequestHandler = (_req, res) => {
    res.json({ "RegularCredits": 42069, "TradesRemaining": 1, "PremiumCreditsFree": 42069, "PremiumCredits": 42069 });
};

export { getCreditsController };
