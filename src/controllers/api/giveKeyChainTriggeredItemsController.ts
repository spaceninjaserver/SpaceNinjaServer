import type { RequestHandler } from "express";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { giveKeyChainItem } from "../../services/questService.ts";
import type { IKeyChainRequest } from "../../types/requestTypes.ts";
import { getAccountForRequest } from "../../services/loginService.ts";

export const giveKeyChainTriggeredItemsController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const keyChainInfo = getJSONfromString<IKeyChainRequest>((req.body as string).toString());

    const inventory = await getInventory(account._id);
    const questKey = inventory.QuestKeys.find(qk => qk.ItemType === keyChainInfo.KeyChain)!;
    const inventoryChanges = await giveKeyChainItem(inventory, keyChainInfo, questKey, account.BuildLabel);
    await inventory.save();

    res.send(inventoryChanges);
};
