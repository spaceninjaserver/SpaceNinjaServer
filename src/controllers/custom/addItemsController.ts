import { getAccountForRequest } from "../../services/loginService.ts";
import { getInventory, addItem } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import { logger } from "../../utils/logger.ts";

export const addItemsController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const accountId = account._id.toString();
    const requests = req.body as IAddItemRequest[];
    const inventory = await getInventory(accountId);
    for (const request of requests) {
        try {
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
        } catch (e) {
            logger.debug(`AddItemRequest ${JSON.stringify(request)} failed: ${(e as Error).message}`);
            res.status(500)
                .send((e as Error).message)
                .end();
            return;
        }
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
