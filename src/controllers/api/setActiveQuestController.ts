import { parseString } from "@/src/helpers/general";
import { getInventory } from "@/src/services/inventoryService";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const setActiveQuestController: RequestHandler = async (req, res) => {
    const newActiveQuest = parseString(req.query.quest);

    const accountId = parseString(req.query.accountId);
    const inventory = await getInventory(accountId);
    inventory.ActiveQuest = newActiveQuest;
    logger.debug(`setting active quest to ${newActiveQuest} for account ${accountId}`);
    res.send([]);
};
