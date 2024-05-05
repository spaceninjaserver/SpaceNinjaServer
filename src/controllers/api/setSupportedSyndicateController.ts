import { RequestHandler } from "express";
import { getInventory } from "@/src/services/inventoryService";

export const setSupportedSyndicateController: RequestHandler = async (req, res) => {
    const inventory = await getInventory(req.query.accountId as string);
    inventory.SupportedSyndicate = req.query.syndicate as string;
    await inventory.save();
    res.end();
};
