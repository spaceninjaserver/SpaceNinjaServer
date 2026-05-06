import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const abandonLibraryDailyTaskController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    await Inventory.updateOne({ accountOwnerId: accountId }, { $unset: { LibraryActiveDailyTaskInfo: 1 } });
    res.status(200).end();
};
