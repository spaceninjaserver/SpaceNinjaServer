import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const clearDialogueHistoryController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const request = JSON.parse(String(req.body)) as IClearDialogueRequest;
    if (inventory.DialogueHistory && inventory.DialogueHistory.Dialogues) {
        inventory.DialogueHistory.Resets ??= 0;
        inventory.DialogueHistory.Resets += 1;
        for (const dialogueName of request.Dialogues) {
            const index = inventory.DialogueHistory.Dialogues.findIndex(x => x.DialogueName == dialogueName);
            if (index != -1) {
                inventory.DialogueHistory.Dialogues.splice(index, 1);
            }
        }
    }
    await inventory.save();
    res.end();
};

interface IClearDialogueRequest {
    Dialogues: string[];
}
