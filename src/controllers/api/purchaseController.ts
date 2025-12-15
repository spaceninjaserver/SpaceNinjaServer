import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";
import type { IPurchaseRequest } from "../../types/purchaseTypes.ts";
import { handlePurchase } from "../../services/purchaseService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";

export const purchaseController: RequestHandler = async (req, res) => {
    const purchaseRequest = JSON.parse(String(req.body)) as IPurchaseRequest;
    const account = await getAccountForRequest(req);
    if (purchaseRequest.buildLabel && account.BuildLabel && purchaseRequest.buildLabel != account.BuildLabel) {
        throw new Error(
            `account logged into ${account.BuildLabel} but is now attempting a purchase in ${purchaseRequest.buildLabel} ?!`
        );
    }
    const accountId = account._id.toString();
    const inventory = await getInventory(accountId);
    const response = await handlePurchase(purchaseRequest, inventory);
    await inventory.save();
    //console.log(JSON.stringify(response, null, 2));
    res.json(response);
    sendWsBroadcastTo(accountId, { update_inventory: true });
};
