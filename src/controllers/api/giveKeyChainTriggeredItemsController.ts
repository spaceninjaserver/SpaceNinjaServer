import { RequestHandler } from "express";
import { parseString } from "@/src/helpers/general";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { IGroup } from "@/src/types/loginTypes";
import { giveKeyChainItem } from "@/src/services/questService";

export const giveKeyChainTriggeredItemsController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    const keyChainInfo = getJSONfromString<IKeyChainRequest>((req.body as string).toString());

    const inventory = await getInventory(accountId);
    const inventoryChanges = giveKeyChainItem(inventory, keyChainInfo);
    await inventory.save();

    res.send(inventoryChanges);
};

export interface IKeyChainRequest {
    KeyChain: string;
    ChainStage: number;
    Groups?: IGroup[];
}
