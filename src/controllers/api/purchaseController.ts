import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { toPurchaseRequest } from "@/src/helpers/purchaseHelpers";
import { handlePurchase } from "@/src/services/purchaseService";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const purchaseController: RequestHandler = async (req, res) => {
    const purchaseRequest = toPurchaseRequest(JSON.parse(String(req.body)));
    const accountId = await getAccountIdForRequest(req);
    const response = await handlePurchase(purchaseRequest, accountId);
    res.json(response);
};
