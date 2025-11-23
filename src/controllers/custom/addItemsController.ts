import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory, addItem } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const addItemsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const requests = req.body as IAddItemRequest[];
    const inventory = await getInventory(accountId);
    for (const request of requests) {
        await addItem(inventory, request.ItemType, request.ItemCount, true, undefined, request.Fingerprint, true);
    }
    if (inventory.isModified()) {
        await inventory.save();
        res.json(true);
        broadcastInventoryUpdate(req);
    } else {
        res.json(false);
    }
};

interface IAddItemRequest {
    ItemType: string;
    ItemCount: number;
    Fingerprint?: string;
}
