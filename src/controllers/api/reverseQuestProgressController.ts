import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { resetQuestKeyToStage } from "../../services/questService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import type { IKeyChainRequest } from "../../types/requestTypes.ts";

export const reverseQuestProgressController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const keyChainInfo = getJSONfromString<IKeyChainRequest>((req.body as string).toString());

    const inventory = await getInventory(accountId);
    resetQuestKeyToStage(inventory, keyChainInfo);
    await inventory.save();

    res.end();
};
