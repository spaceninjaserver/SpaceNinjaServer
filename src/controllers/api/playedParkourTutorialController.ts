import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const playedParkourTutorialController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    await Inventory.updateOne({ accountOwnerId: accountId }, { PlayedParkourTutorial: true });
    res.end();
};
