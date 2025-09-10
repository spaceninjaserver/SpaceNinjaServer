import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const setSupportedSyndicateController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);

    await Inventory.updateOne(
        {
            accountOwnerId: accountId
        },
        {
            SupportedSyndicate: req.query.syndicate as string
        }
    );

    res.end();
    broadcastInventoryUpdate(req);
};
