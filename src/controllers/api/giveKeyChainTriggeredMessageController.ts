import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { giveKeyChainMessage } from "../../services/questService.ts";
import type { IKeyChainRequest } from "../../types/requestTypes.ts";
import type { RequestHandler } from "express";

export const giveKeyChainTriggeredMessageController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const keyChainInfo = JSON.parse((req.body as Buffer).toString()) as IKeyChainRequest;

    const inventory = await getInventory(accountId, "QuestKeys");
    await giveKeyChainMessage(inventory, accountId, keyChainInfo);
    await inventory.save();

    res.send(1);
};
