import { RequestHandler } from "express";
import view from "@/static/fixed_responses/view.json";

const viewController: RequestHandler = (_req, res) => {
  res.json(view);
};

export { viewController };
