import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { ICompletedDialogue } from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";

export const saveDialogueController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = JSON.parse(String(req.body)) as SaveDialogueRequest;
    if ("YearIteration" in request) {
        const inventory = await getInventory(accountId);
        if (inventory.DialogueHistory) {
            inventory.DialogueHistory.YearIteration = request.YearIteration;
        } else {
            inventory.DialogueHistory = { YearIteration: request.YearIteration };
        }
        await inventory.save();
        res.end();
    } else {
        const inventory = await getInventory(accountId);
        if (!inventory.DialogueHistory) {
            throw new Error("bad inventory state");
        }
        if (request.OtherDialogueInfos.length != 0) {
            logger.error(`saveDialogue request not fully handled: ${String(req.body)}`);
        }
        inventory.DialogueHistory.Dialogues ??= [];
        let dialogue = inventory.DialogueHistory.Dialogues.find(x => x.DialogueName == request.DialogueName);
        if (!dialogue) {
            dialogue =
                inventory.DialogueHistory.Dialogues[
                    inventory.DialogueHistory.Dialogues.push({
                        Rank: 0,
                        Chemistry: 0,
                        AvailableDate: new Date(0),
                        AvailableGiftDate: new Date(0),
                        RankUpExpiry: new Date(0),
                        BountyChemExpiry: new Date(0),
                        QueuedDialogues: [],
                        Gifts: [],
                        Booleans: [],
                        Completed: [],
                        DialogueName: request.DialogueName
                    }) - 1
                ];
        }
        dialogue.Rank = request.Rank;
        dialogue.Chemistry = request.Chemistry;
        dialogue.QueuedDialogues = request.QueuedDialogues;
        for (const bool of request.Booleans) {
            dialogue.Booleans.push(bool);
        }
        for (const bool of request.ResetBooleans) {
            const index = dialogue.Booleans.findIndex(x => x == bool);
            if (index != -1) {
                dialogue.Booleans.splice(index, 1);
            }
        }
        dialogue.Completed.push(request.Data);
        const tomorrowAt0Utc = (Math.trunc(Date.now() / (86400 * 1000)) + 1) * 86400 * 1000;
        dialogue.AvailableDate = new Date(tomorrowAt0Utc);
        await inventory.save();
        res.json({
            InventoryChanges: [],
            AvailableDate: { $date: { $numberLong: tomorrowAt0Utc.toString() } }
        });
    }
};

type SaveDialogueRequest = SaveYearIterationRequest | SaveCompletedDialogueRequest;

interface SaveYearIterationRequest {
    YearIteration: number;
}

interface SaveCompletedDialogueRequest {
    DialogueName: string;
    Rank: number;
    Chemistry: number;
    CompletionType: number;
    QueuedDialogues: string[];
    Booleans: string[];
    ResetBooleans: string[];
    Data: ICompletedDialogue;
    OtherDialogueInfos: IOtherDialogueInfo[]; // unsure
}

interface IOtherDialogueInfo {
    Dialogue: string;
    Tag: string;
    Value: number;
}
