import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import type { RequestHandler } from "express";

export const abandonLibraryDailyTaskController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    inventory.LibraryActiveDailyTaskInfo = undefined;
    await inventory.save();
    res.status(200).end();
};
