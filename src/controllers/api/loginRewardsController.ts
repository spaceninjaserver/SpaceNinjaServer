import { RequestHandler } from "express";
import loginRewards from "@/static/fixed_responses/loginRewards.json";

const loginRewardsController: RequestHandler = (_req, res) => {
  res.json(loginRewards);
};

export { loginRewardsController };
