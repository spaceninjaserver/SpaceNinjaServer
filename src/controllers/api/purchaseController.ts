/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PurchaseItem } from "@/src/services/tradeService";
import { Request, Response } from "express";

const purchaseController = (_req: Request, res: Response): void => {
    const body = JSON.parse(_req.body);
    const response = PurchaseItem(
        body.PurchaseParams.StoreItem,
        body.PurchaseParams.Quantity,
        body.PurchaseParams.UsePremium,
        body.PurchaseParams.ExpectedPrice
    );
    res.json({ InventoryChanges: response });
};

export { purchaseController };
