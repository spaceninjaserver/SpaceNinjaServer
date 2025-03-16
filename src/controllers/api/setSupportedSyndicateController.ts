import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";

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
};
