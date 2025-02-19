import { IKeyChainRequest } from "@/src/controllers/api/giveKeyChainTriggeredItemsController";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { giveKeyChainMessage } from "@/src/services/questService";
import { RequestHandler } from "express";

export const giveKeyChainTriggeredMessageController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const keyChainInfo = JSON.parse((req.body as Buffer).toString()) as IKeyChainRequest;

    const inventory = await getInventory(accountId, "QuestKeys");
    await giveKeyChainMessage(inventory, accountId, keyChainInfo);
    await inventory.save();

    res.send(1);
};
