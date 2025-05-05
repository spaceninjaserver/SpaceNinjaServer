import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

// Basic shim handling action=sync to login on U21
export const questControlController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const quests: IQuestState[] = [];
    for (const quest of inventory.QuestKeys) {
        quests.push({
            quest: quest.ItemType,
            state: 3 // COMPLETE
        });
    }
    res.json({
        QuestState: quests
    });
};

interface IQuestState {
    quest: string;
    state: number;
    task?: string;
}
