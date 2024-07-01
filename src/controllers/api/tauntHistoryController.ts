import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";
import { ITaunt } from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
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
