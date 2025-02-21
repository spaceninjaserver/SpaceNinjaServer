import { addString } from "@/src/controllers/api/inventoryController";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addQuestKey, completeQuest, IUpdateQuestRequest, updateQuestKey } from "@/src/services/questService";
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
        | "updateKey"
        | "giveAll";
    const questKeyUpdate = req.body as IUpdateQuestRequest["QuestKeys"];

    const allQuestKeys: string[] = [];
    for (const [k, v] of Object.entries(ExportKeys)) {
        if ("chainStages" in v) {
            allQuestKeys.push(k);
        }
    }
    const inventory = await getInventory(accountId);

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
                try {
                    await completeQuest(inventory, questKey);
                } catch (error) {
                    if (error instanceof Error) {
                        logger.error(
                            `Something went wrong completing quest ${questKey}, probably could not add some item`
                        );
                        logger.error(error.message);
                    }
                }

                //Skip "Watch The Maker"
                if (questKey === "/Lotus/Types/Keys/NewWarIntroQuest/NewWarIntroKeyChain") {
                    addString(
                        inventory.NodeIntrosCompleted,
                        "/Lotus/Levels/Cinematics/NewWarIntro/NewWarStageTwo.level"
                    );
                }

                if (questKey === "/Lotus/Types/Keys/ArchwingQuest/ArchwingQuestKeyChain") {
                    inventory.ArchwingEnabled = true;
                }
            }

            inventory.ActiveQuest = "";
            break;
        }
        case "ResetAll": {
            logger.info("resetting all quests..");
            for (const questKey of inventory.QuestKeys) {
                questKey.Completed = false;
                questKey.Progress = [];
                questKey.CompletionDate = undefined;
            }
            inventory.ActiveQuest = "";
            break;
        }
        case "completeAllUnlocked": {
            logger.info("completing all unlocked quests..");
            for (const questKey of inventory.QuestKeys) {
                try {
                    await completeQuest(inventory, questKey.ItemType);
                } catch (error) {
                    if (error instanceof Error) {
                        logger.error(
                            `Something went wrong completing quest ${questKey.ItemType}, probably could not add some item`
                        );
                        logger.error(error.message);
                    }
                }

                //Skip "Watch The Maker"
                if (questKey.ItemType === "/Lotus/Types/Keys/NewWarIntroQuest/NewWarIntroKeyChain") {
                    addString(
                        inventory.NodeIntrosCompleted,
                        "/Lotus/Levels/Cinematics/NewWarIntro/NewWarStageTwo.level"
                    );
                }

                if (questKey.ItemType === "/Lotus/Types/Keys/ArchwingQuest/ArchwingQuestKeyChain") {
                    inventory.ArchwingEnabled = true;
                }
            }
            inventory.ActiveQuest = "";
            break;
        }
        case "giveAll": {
            for (const questKey of allQuestKeys) {
                addQuestKey(inventory, { ItemType: questKey });
            }
            break;
        }
    }

    await inventory.save();
    res.status(200).end();
};
