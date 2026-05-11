import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { giveKeyChainMessage } from "../../services/questService.ts";
import type { IKeyChainRequest } from "../../types/requestTypes.ts";
import type { RequestHandler } from "express";

export const giveKeyChainTriggeredMessageController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const keyChainInfo = JSON.parse((req.body as Buffer).toString()) as IKeyChainRequest;

    const inventory = await getInventory(account._id, "QuestKeys accountOwnerId");
    const questKey = inventory.QuestKeys.find(qk => qk.ItemType === keyChainInfo.KeyChain)!;
    await giveKeyChainMessage(inventory, keyChainInfo, questKey, true, buildLabel);
    await inventory.save();

    res.send(1);
};
