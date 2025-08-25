import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory, addItem } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";

export const addItemsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const requests = req.body as IAddItemRequest[];
    const inventory = await getInventory(accountId);
    for (const request of requests) {
        await addItem(inventory, request.ItemType, request.ItemCount, true, undefined, request.Fingerprint, true);
    }
    await inventory.save();
    res.end();
};

interface IAddItemRequest {
    ItemType: string;
    ItemCount: number;
    Fingerprint?: string;
}
