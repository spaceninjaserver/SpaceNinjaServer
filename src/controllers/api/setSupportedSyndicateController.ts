import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";

export const setSupportedSyndicateController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    inventory.SupportedSyndicate = req.query.syndicate as string;
    await inventory.save();
    res.end();
};
