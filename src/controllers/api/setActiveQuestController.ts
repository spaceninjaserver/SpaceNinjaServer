import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const setActiveQuestController: RequestHandler<
    Record<string, never>,
    undefined,
    undefined,
    { quest: string | undefined }
> = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const quest = req.query.quest;

    const inventory = await getInventory(accountId, "ActiveQuest");
    inventory.ActiveQuest = quest ?? "";
    await inventory.save();
    res.status(200).end();
};
