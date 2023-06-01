import purchase from "@/static/fixed_responses/purchase.json";
import { Request, Response } from "express";

export default (_req: Request, res: Response): void => {
  res.json(purchase);
};
