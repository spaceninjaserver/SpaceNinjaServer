import { IKeyChainRequest } from "@/src/controllers/api/giveKeyChainTriggeredItemsController";
import { IMessage } from "@/src/models/inboxModel";
import { createMessage } from "@/src/services/inboxService";
import { getInventory } from "@/src/services/inventoryService";
import { getKeyChainMessage } from "@/src/services/itemDataService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { updateQuestStage } from "@/src/services/questService";
import { RequestHandler } from "express";

export const giveKeyChainTriggeredMessageController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const keyChainInfo = JSON.parse((req.body as Buffer).toString()) as IKeyChainRequest;

    const keyChainMessage = getKeyChainMessage(keyChainInfo);

    const message = {
        sndr: keyChainMessage.sender,
        msg: keyChainMessage.body,
        sub: keyChainMessage.title,
        att: keyChainMessage.attachments.length > 0 ? keyChainMessage.attachments : undefined,
        icon: keyChainMessage.icon ?? "",
        transmission: keyChainMessage.transmission ?? "",
        highPriority: keyChainMessage.highPriority ?? false,
        r: false
    } satisfies IMessage;

    await createMessage(accountId, [message]);

    const inventory = await getInventory(accountId, "QuestKeys");
    updateQuestStage(inventory, keyChainInfo, { m: true });
    await inventory.save();

    res.send(1);
};
