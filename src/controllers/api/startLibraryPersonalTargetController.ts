import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const startLibraryPersonalTargetController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    await Inventory.updateOne({ accountOwnerId: accountId }, { LibraryPersonalTarget: req.query.target as string });
    res.json({
        IsQuest: req.query.target == "/Lotus/Types/Game/Library/Targets/DragonframeQuestTarget",
        Target: req.query.target
    });
};
