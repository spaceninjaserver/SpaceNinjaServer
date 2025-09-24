import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import type { IBooster } from "../../types/inventoryTypes/inventoryTypes.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const setBoosterController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const requests = req.body as IBooster[];
    const inventory = await getInventory(accountId, "Boosters");
    for (const request of requests) {
        const index = inventory.Boosters.findIndex(item => item.ItemType === request.ItemType);
        if (index !== -1) {
            inventory.Boosters[index].ExpiryDate = request.ExpiryDate;
        } else {
            inventory.Boosters.push(request);
        }
    }
    await inventory.save();
    res.end();
    broadcastInventoryUpdate(req);
};
