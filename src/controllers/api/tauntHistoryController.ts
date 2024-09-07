import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";
import { ITaunt } from "@/src/types/inventoryTypes/inventoryTypes";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const tauntHistoryController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    if (req.body !== undefined) {
        const clientTaunt = JSON.parse(String(req.body)) as ITaunt;
        inventory.TauntHistory ??= [];
        inventory.TauntHistory.push(clientTaunt);
        await inventory.save();
        res.end();
    } else {
        res.json({});
    }
};
