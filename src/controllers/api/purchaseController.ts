import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import type { IPurchaseRequest } from "@/src/types/purchaseTypes";
import { handlePurchase } from "@/src/services/purchaseService";
import { getInventory } from "@/src/services/inventoryService";
import { sendWsBroadcastTo } from "@/src/services/wsService";

export const purchaseController: RequestHandler = async (req, res) => {
    const purchaseRequest = JSON.parse(String(req.body)) as IPurchaseRequest;
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const response = await handlePurchase(purchaseRequest, inventory);
    await inventory.save();
    //console.log(JSON.stringify(response, null, 2));
    res.json(response);
    sendWsBroadcastTo(accountId, { update_inventory: true });
};
