import { RequestHandler } from "express";
import { parseString } from "@/src/helpers/general";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { giveKeyChainItem } from "@/src/services/questService";
import { IKeyChainRequest } from "@/src/types/requestTypes";

export const giveKeyChainTriggeredItemsController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    const keyChainInfo = getJSONfromString<IKeyChainRequest>((req.body as string).toString());

    const inventory = await getInventory(accountId);
    const inventoryChanges = await giveKeyChainItem(inventory, keyChainInfo);
    await inventory.save();

    res.send(inventoryChanges);
};
