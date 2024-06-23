import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const setActiveQuestController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const quest = req.query.quest as string;

    const inventory = await getInventory(accountId);
    const questKey = inventory.QuestKeys.find(q => q.ItemType == quest);
    if (questKey == null)
        inventory.QuestKeys.push({ ItemType: quest });
    inventory.ActiveQuest = quest;
    await inventory.save();

    res.json({
        inventoryChanges: {
            QuestKey: [{
                ItemType: quest
            }],
            Herses: [],
            PremiumCreditsFree: 0,
            PremiumCredits: 0,
            RegularCredits: 0
        }
    });
};

export { setActiveQuestController };
