import { getAccountIdForRequest } from "@/src/services/loginService";
import { toPurchaseRequest } from "@/src/helpers/purchaseHelpers";
import { handlePurchase } from "@/src/services/purchaseService";
import { Request, Response } from "express";

export const purchaseController = async (req: Request, res: Response) => {
    const purchaseRequest = toPurchaseRequest(JSON.parse(String(req.body)));
    const accountId = await getAccountIdForRequest(req);
    const response = await handlePurchase(purchaseRequest, accountId);
    res.json(response);
};
