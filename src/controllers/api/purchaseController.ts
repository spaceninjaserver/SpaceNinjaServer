import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IPurchaseRequest } from "../../types/purchaseTypes.ts";
import { handlePurchase } from "../../services/purchaseService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";

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
