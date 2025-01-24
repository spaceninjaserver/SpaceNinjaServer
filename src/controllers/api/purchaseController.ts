import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IPurchaseRequest } from "@/src/types/purchaseTypes";
import { handlePurchase } from "@/src/services/purchaseService";
import { getInventory } from "@/src/services/inventoryService";

export const purchaseController: RequestHandler = async (req, res) => {
    const purchaseRequest = JSON.parse(String(req.body)) as IPurchaseRequest;
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const response = await handlePurchase(purchaseRequest, inventory);
    await inventory.save();
    res.json(response);
};
