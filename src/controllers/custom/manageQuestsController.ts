import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import {
    addQuestKey,
    completeQuest,
    giveKeyChainMissionReward,
    giveKeyChainStageTriggered
} from "../../services/questService.ts";
import { logger } from "../../utils/logger.ts";
import type { RequestHandler } from "express";
import { ExportKeys } from "warframe-public-export-plus";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

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
            for (const questKey of inventory.QuestKeys) {
                await completeQuest(inventory, questKey.ItemType, undefined);
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
            allQuestKeys.forEach(questKey => addQuestKey(inventory, { ItemType: questKey }, true));
            break;
        }
        case "deleteKey": {
            const questKey = inventory.QuestKeys.find(key => key.ItemType === questItemType);
            if (!questKey) {
                logger.error(`Quest key not found in inventory: ${questItemType}`);
                break;
            }
            inventory.QuestKeys.pull({ ItemType: questItemType });
            if (inventory.ActiveQuest == questItemType) inventory.ActiveQuest = "";
            break;
        }
        case "completeKey": {
            if (allQuestKeys.includes(questItemType)) {
                const questKey = inventory.QuestKeys.find(key => key.ItemType === questItemType);
                if (!questKey) {
                    logger.error(`Quest key not found in inventory: ${questItemType}`);
                    break;
                }

                await completeQuest(inventory, questItemType, undefined);
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

                const run = questKey.Progress[0]?.c ?? 0;
                const stage = questKey.Progress.map(p => p.c).lastIndexOf(run);

                if (run > 0) {
                    questKey.Progress[stage].c = run - 1;
                } else {
                    questKey.Progress.pop();
                }

                if (stage > 0) {
                    await giveKeyChainStageTriggered(inventory, {
                        KeyChain: questKey.ItemType,
                        ChainStage: stage - 1
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

                const run = questKey.Progress[0]?.c ?? 0;
                const currentStage = questKey.Progress.map(p => p.c).lastIndexOf(run);

                if (currentStage + 1 == questManifest.chainStages?.length) {
                    logger.debug(`Trying to complete last stage with nextStage, calling completeQuest instead`);
                    await completeQuest(inventory, questKey.ItemType, undefined, true);
                } else {
                    if (run > 0) {
                        questKey.Progress[currentStage + 1].c = run;
                    } else {
                        questKey.Progress.push({ c: run, i: false, m: false, b: [] });
                    }

                    await giveKeyChainStageTriggered(inventory, {
                        KeyChain: questKey.ItemType,
                        ChainStage: currentStage + 1
                    });

                    if (currentStage > 0) {
                        await giveKeyChainMissionReward(
                            inventory,
                            {
                                KeyChain: questKey.ItemType,
                                ChainStage: currentStage
                            },
                            undefined
                        );
                    }
                }
            }
            break;
        }
        case "setInactive":
            inventory.ActiveQuest = "";
            break;
    }

    if (inventory.isModified()) {
        await inventory.save();
        res.json(true);
        broadcastInventoryUpdate(req);
    } else {
        res.json(false);
    }
};
