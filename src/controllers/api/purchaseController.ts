import purchase from "@/static/fixed_responses/purchase.json";
import { Request, Response } from "express";

const purchaseController = (_req: Request, res: Response): void => {
    res.json(purchase);
};

export { purchaseController };
