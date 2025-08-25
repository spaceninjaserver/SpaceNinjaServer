import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { ITaunt } from "../../types/inventoryTypes/inventoryTypes.ts";
import { logger } from "../../utils/logger.ts";

export const tauntHistoryController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const clientTaunt = JSON.parse(String(req.body)) as ITaunt;
    logger.debug(`updating taunt ${clientTaunt.node} to state ${clientTaunt.state}`);
    inventory.TauntHistory ??= [];
    const taunt = inventory.TauntHistory.find(x => x.node == clientTaunt.node);
    if (taunt) {
        taunt.state = clientTaunt.state;
    } else {
        inventory.TauntHistory.push(clientTaunt);
    }
    await inventory.save();
    res.end();
};
