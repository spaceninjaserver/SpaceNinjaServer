import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import type { RequestHandler } from "express";

export const startLibraryDailyTaskController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    inventory.LibraryActiveDailyTaskInfo = inventory.LibraryAvailableDailyTaskInfo;
    await inventory.save();
    res.json(inventory.LibraryAvailableDailyTaskInfo);
};
