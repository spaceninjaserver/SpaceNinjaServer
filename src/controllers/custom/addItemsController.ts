import { getAccountForRequest, hasPermission } from "../../services/loginService.ts";
import { getInventory, addItem } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import { logger } from "../../utils/logger.ts";
import { BL_LATEST } from "../../constants/gameVersions.ts";

export const addItemsController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!hasPermission(account, "addItems")) {
        res.status(500).send(`Permission denied`).end();
        return;
    }
    const requests = req.body as IAddItemRequest[];
    const inventory = await getInventory(account._id, undefined);
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
                BL_LATEST
            );
        } catch (e) {
            logger.debug(`AddItemRequest ${JSON.stringify(request)} failed: ${(e as Error).message}`);
            res.status(500)
                .send((e as Error).message)
                .end();
            return;
        }
    }
    const modifiedPaths = inventory.modifiedPaths();
    if (modifiedPaths.length) {
        await inventory.save();
    }
    res.json(modifiedPaths);
    if (modifiedPaths.length) {
        broadcastInventoryUpdate(req);
    }
};

interface IAddItemRequest {
    ItemType: string;
    ItemCount: number;
    Fingerprint?: string;
}
