import { addString } from "@/src/controllers/api/inventoryController";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addQuestKey, IUpdateQuestRequest, updateQuestKey } from "@/src/services/questService";
import { IQuestStage } from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";
import { ExportKeys } from "warframe-public-export-plus";

export const manageQuestsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const operation = req.query.operation as
        | "unlockAll"
        | "completeAll"
        | "ResetAll"
        | "completeAllUnlocked"
        | "updateKey";
    const questKeyUpdate = req.body as IUpdateQuestRequest["QuestKeys"];

    const allQuestKeys: string[] = [];
    for (const [k, v] of Object.entries(ExportKeys)) {
        if ("chainStages" in v) {
            allQuestKeys.push(k);
        }
    }
    const inventory = await getInventory(accountId, "QuestKeys NodeIntrosCompleted");

    switch (operation) {
        case "updateKey": {
            //TODO: if this is intended to be used, one needs to add a updateQuestKeyMultiple, the game does never intend to do it, so it errors for multiple keys.
            updateQuestKey(inventory, questKeyUpdate);
            break;
        }
        case "unlockAll": {
            for (const questKey of allQuestKeys) {
                addQuestKey(inventory, { ItemType: questKey, Completed: false, unlock: true, Progress: [] });
            }
            break;
        }
        case "completeAll": {
            logger.info("completing all quests..");
            for (const questKey of allQuestKeys) {
                const chainStageTotal = ExportKeys[questKey].chainStages?.length ?? 0;
                const Progress = Array(chainStageTotal).fill({ c: 0, i: true, m: true, b: [] } satisfies IQuestStage);
                const inventoryQuestKey = inventory.QuestKeys.find(qk => qk.ItemType === questKey);
                if (inventoryQuestKey) {
                    inventoryQuestKey.Completed = true;
                    inventoryQuestKey.Progress = Progress;
                    continue;
                }
                addQuestKey(inventory, { ItemType: questKey, Completed: true, unlock: true, Progress: Progress });
            }
            inventory.ArchwingEnabled = true;
            inventory.ActiveQuest = "";

            // Skip "Watch The Maker"
            addString(inventory.NodeIntrosCompleted, "/Lotus/Levels/Cinematics/NewWarIntro/NewWarStageTwo.level");
            break;
        }
        case "ResetAll": {
            logger.info("resetting all quests..");
            for (const questKey of inventory.QuestKeys) {
                questKey.Completed = false;
                questKey.Progress = [];
            }
            break;
        }
        case "completeAllUnlocked": {
            logger.info("completing all unlocked quests..");
            for (const questKey of inventory.QuestKeys) {
                //if (!questKey.unlock) { continue; }
                questKey.Completed = true;
            }
            break;
        }
    }

    await inventory.save();
    res.status(200).end();
};
