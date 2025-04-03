import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import {
    addQuestKey,
    completeQuest,
    giveKeyChainMissionReward,
    giveKeyChainStageTriggered
} from "@/src/services/questService";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";
import { ExportKeys } from "warframe-public-export-plus";

export const manageQuestsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const operation = req.query.operation as
        | "completeAll"
        | "resetAll"
        | "giveAll"
        | "completeKey"
        | "deleteKey"
        | "resetKey"
        | "prevStage"
        | "nextStage"
        | "setInactive";

    const questItemType = req.query.itemType as string;

    const allQuestKeys: string[] = [];
    for (const [k, v] of Object.entries(ExportKeys)) {
        if ("chainStages" in v) {
            allQuestKeys.push(k);
        }
    }
    const inventory = await getInventory(accountId);

    switch (operation) {
        case "completeAll": {
            if (allQuestKeys.includes(questItemType)) {
                for (const questKey of inventory.QuestKeys) {
                    await completeQuest(inventory, questKey.ItemType);
                }
            }
            break;
        }
        case "resetAll": {
            for (const questKey of inventory.QuestKeys) {
                questKey.Completed = false;
                questKey.Progress = [];
                questKey.CompletionDate = undefined;
            }
            inventory.ActiveQuest = "";
            break;
        }
        case "giveAll": {
            allQuestKeys.forEach(questKey => addQuestKey(inventory, { ItemType: questKey }));
            break;
        }
        case "deleteKey": {
            if (allQuestKeys.includes(questItemType)) {
                const questKey = inventory.QuestKeys.find(key => key.ItemType === questItemType);
                if (!questKey) {
                    logger.error(`Quest key not found in inventory: ${questItemType}`);
                    break;
                }

                inventory.QuestKeys.pull({ ItemType: questItemType });
            }
            break;
        }
        case "completeKey": {
            if (allQuestKeys.includes(questItemType)) {
                const questKey = inventory.QuestKeys.find(key => key.ItemType === questItemType);
                if (!questKey) {
                    logger.error(`Quest key not found in inventory: ${questItemType}`);
                    break;
                }

                await completeQuest(inventory, questItemType);
            }
            break;
        }
        case "resetKey": {
            if (allQuestKeys.includes(questItemType)) {
                const questKey = inventory.QuestKeys.find(key => key.ItemType === questItemType);
                if (!questKey) {
                    logger.error(`Quest key not found in inventory: ${questItemType}`);
                    break;
                }

                questKey.Completed = false;
                questKey.Progress = [];
                questKey.CompletionDate = undefined;
            }
            break;
        }
        case "prevStage": {
            if (allQuestKeys.includes(questItemType)) {
                const questKey = inventory.QuestKeys.find(key => key.ItemType === questItemType);
                if (!questKey) {
                    logger.error(`Quest key not found in inventory: ${questItemType}`);
                    break;
                }
                if (!questKey.Progress) break;

                if (questKey.Completed) {
                    questKey.Completed = false;
                    questKey.CompletionDate = undefined;
                }
                questKey.Progress.pop();
                const stage = questKey.Progress.length - 1;
                if (stage > 0) {
                    await giveKeyChainStageTriggered(inventory, {
                        KeyChain: questKey.ItemType,
                        ChainStage: stage
                    });
                }
            }
            break;
        }
        case "nextStage": {
            if (allQuestKeys.includes(questItemType)) {
                const questKey = inventory.QuestKeys.find(key => key.ItemType === questItemType);
                const questManifest = ExportKeys[questItemType];
                if (!questKey) {
                    logger.error(`Quest key not found in inventory: ${questItemType}`);
                    break;
                }
                if (!questKey.Progress) break;

                const currentStage = questKey.Progress.length;
                if (currentStage + 1 == questManifest.chainStages?.length) {
                    logger.debug(`Trying to complete last stage with nextStage, calling completeQuest instead`);
                    await completeQuest(inventory, questKey.ItemType);
                } else {
                    const progress = {
                        c: questManifest.chainStages![currentStage].key ? -1 : 0,
                        i: false,
                        m: false,
                        b: []
                    };
                    questKey.Progress.push(progress);

                    await giveKeyChainStageTriggered(inventory, {
                        KeyChain: questKey.ItemType,
                        ChainStage: currentStage
                    });

                    if (currentStage > 0) {
                        await giveKeyChainMissionReward(inventory, {
                            KeyChain: questKey.ItemType,
                            ChainStage: currentStage - 1
                        });
                    }
                }
            }
            break;
        }
        case "setInactive":
            inventory.ActiveQuest = "";
            break;
    }

    await inventory.save();
    res.status(200).end();
};
