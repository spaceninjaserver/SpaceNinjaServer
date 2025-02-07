import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const setActiveQuestController: RequestHandler<
    Record<string, never>,
    undefined,
    undefined,
    { quest: string | undefined }
> = async (req, res) => {
    console.log("req params", JSON.stringify(req.params, null, 2));
    console.log("req query", JSON.stringify(req.query, null, 2));
    console.log("req body", JSON.stringify(req.body, null, 2));
    const accountId = await getAccountIdForRequest(req);
    const quest = req.query.quest;

    const inventory = await getInventory(accountId, "ActiveQuest");
    inventory.ActiveQuest = quest ?? "";
    await inventory.save();
    res.status(200).end();
};
