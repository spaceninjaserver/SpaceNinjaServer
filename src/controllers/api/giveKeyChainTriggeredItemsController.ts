import type { RequestHandler } from "express";
import { parseString } from "../../helpers/general.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { giveKeyChainItem } from "../../services/questService.ts";
import type { IKeyChainRequest } from "../../types/requestTypes.ts";

export const giveKeyChainTriggeredItemsController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    const keyChainInfo = getJSONfromString<IKeyChainRequest>((req.body as string).toString());

    const inventory = await getInventory(accountId);
    const questKey = inventory.QuestKeys.find(qk => qk.ItemType === keyChainInfo.KeyChain)!;
    const inventoryChanges = await giveKeyChainItem(inventory, keyChainInfo, questKey);
    await inventory.save();

    res.send(inventoryChanges);
};
