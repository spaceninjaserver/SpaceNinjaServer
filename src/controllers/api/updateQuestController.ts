import { RequestHandler } from "express";
import { parseString } from "@/src/helpers/general";
import { logger } from "@/src/utils/logger";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { updateQuestKey, IUpdateQuestRequest } from "@/src/services/questService";
import { getQuestCompletionItems } from "@/src/services/itemDataService";
import { addItem, addItems, combineInventoryChanges, getInventory } from "@/src/services/inventoryService";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const updateQuestController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    const updateQuestRequest = getJSONfromString<IUpdateQuestRequest>((req.body as string).toString());

    // updates should be made only to one quest key per request
    if (updateQuestRequest.QuestKeys.length > 1) {
        throw new Error(`quest keys array should only have 1 item, but has ${updateQuestRequest.QuestKeys.length}`);
    }

    const inventory = await getInventory(accountId);

    updateQuestKey(inventory, updateQuestRequest.QuestKeys);

    if (updateQuestRequest.QuestKeys[0].Completed) {
        logger.debug(`completed quest ${updateQuestRequest.QuestKeys[0].ItemType} `);
        const questKeyName = updateQuestRequest.QuestKeys[0].ItemType;
        const questCompletionItems = getQuestCompletionItems(questKeyName);
        logger.debug(`quest completion items`, questCompletionItems);

        const inventoryChanges = await addItems(inventory, questCompletionItems);
        await inventory.save();

        res.json({ MissionRewards: [], inventoryChanges });
        return;
    }

    await inventory.save();
    res.send({ MissionRewards: [] });
};
