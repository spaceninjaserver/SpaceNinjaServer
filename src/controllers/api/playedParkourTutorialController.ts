import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { getAccountIdForRequest } from "@/src/services/loginService";
import type { RequestHandler } from "express";

export const playedParkourTutorialController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    await Inventory.updateOne({ accountOwnerId: accountId }, { PlayedParkourTutorial: true });
    res.end();
};
