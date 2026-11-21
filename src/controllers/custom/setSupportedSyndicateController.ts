import type { RequestHandler } from "express";
import { ExportSyndicates } from "warframe-public-export-plus";
import { getAccountForRequest, hasPermission } from "../../services/loginService.ts";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const setSupportedSyndicateController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!hasPermission(account, "setSupportedSyndicate")) {
        res.status(500).send(`Permission denied`).end();
        return;
    }
    const request = req.body as ISetSupportedSyndicateRequest;
    if (request.Tag && !(request.Tag in ExportSyndicates)) {
        res.status(400).end();
        return;
    }

    await Inventory.updateOne(
        { accountOwnerId: account._id },
        request.Tag ? { SupportedSyndicate: request.Tag } : { $unset: { SupportedSyndicate: 1 } }
    );
    res.end();
    broadcastInventoryUpdate(req);
};

interface ISetSupportedSyndicateRequest {
    Tag: string;
}
