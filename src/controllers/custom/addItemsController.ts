import { getAccountForRequest } from "../../services/loginService.ts";
import { getInventory, addItem } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const addItemsController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const accountId = account._id.toString();
    const requests = req.body as IAddItemRequest[];
    const inventory = await getInventory(accountId);
    for (const request of requests) {
        await addItem(
            inventory,
            request.ItemType,
            request.ItemCount,
            true,
            undefined,
            request.Fingerprint,
            true,
            account.BuildLabel
        );
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
