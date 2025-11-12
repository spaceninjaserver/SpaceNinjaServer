import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const setUmbraEchoesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = req.body as ISetUmbraEchoesRequest;
    const inventory = await getInventory(accountId, "Suits");
    const suit = inventory.Suits.id(request.oid);
    if (suit) {
        suit.UmbraDate = request.UmbraDate ? new Date(request.UmbraDate) : undefined;
        await inventory.save();
        broadcastInventoryUpdate(req);
    }
    res.end();
};

interface ISetUmbraEchoesRequest {
    oid: string;
    UmbraDate: number;
}
