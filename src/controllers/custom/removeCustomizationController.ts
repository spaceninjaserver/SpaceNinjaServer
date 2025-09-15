import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const removeCustomizationController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const ItemType = req.query.itemType as string;
    const inventory = await getInventory(accountId, "FlavourItems");
    inventory.FlavourItems.pull({ ItemType });
    await inventory.save();
    res.end();
    broadcastInventoryUpdate(req);
};
