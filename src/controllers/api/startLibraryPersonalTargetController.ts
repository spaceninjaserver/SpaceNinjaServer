import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const startLibraryPersonalTargetController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    inventory.LibraryPersonalTarget = req.query.target as string;
    await inventory.save();
    res.json({
        IsQuest: false,
        Target: req.query.target
    });
};
