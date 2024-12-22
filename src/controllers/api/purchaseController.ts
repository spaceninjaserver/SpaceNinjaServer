import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IPurchaseRequest } from "@/src/types/purchaseTypes";
import { handlePurchase } from "@/src/services/purchaseService";

export const purchaseController: RequestHandler = async (req, res) => {
    const purchaseRequest = JSON.parse(String(req.body)) as IPurchaseRequest;
    const accountId = await getAccountIdForRequest(req);
    const response = await handlePurchase(purchaseRequest, accountId);
    res.json(response);
};
