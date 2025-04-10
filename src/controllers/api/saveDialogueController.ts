import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { addEmailItem, getInventory, updateCurrency } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { ICompletedDialogue, IDialogueDatabase } from "@/src/types/inventoryTypes/inventoryTypes";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";

export const saveDialogueController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = JSON.parse(String(req.body)) as SaveDialogueRequest;
    if ("YearIteration" in request) {
        const inventory = await getInventory(accountId, "DialogueHistory");
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
        const inventoryChanges: IInventoryChanges = {};
        const tomorrowAt0Utc = (Math.trunc(Date.now() / 86400_000) + 1) * 86400_000;
        inventory.DialogueHistory.Dialogues ??= [];
        const dialogue = getDialogue(inventory, request.DialogueName);
        dialogue.Rank = request.Rank;
        dialogue.Chemistry = request.Chemistry;
        if (request.Data) {
            dialogue.QueuedDialogues = request.QueuedDialogues;
            for (const bool of request.Booleans) {
                dialogue.Booleans.push(bool);
                if (bool == "LizzieShawzin") {
                    await addEmailItem(
                        inventory,
                        "/Lotus/Types/Items/EmailItems/LizzieShawzinSkinEmailItem",
                        inventoryChanges
                    );
                }
            }
            for (const bool of request.ResetBooleans) {
                const index = dialogue.Booleans.findIndex(x => x == bool);
                if (index != -1) {
                    dialogue.Booleans.splice(index, 1);
                }
            }
            dialogue.Completed.push(request.Data);
            dialogue.AvailableDate = new Date(tomorrowAt0Utc);
            for (const info of request.OtherDialogueInfos) {
                const otherDialogue = getDialogue(inventory, info.Dialogue);
                if (info.Tag != "") {
                    otherDialogue.QueuedDialogues.push(info.Tag);
                }
                otherDialogue.Chemistry += info.Value; // unsure
            }
            await inventory.save();
            res.json({
                InventoryChanges: inventoryChanges,
                AvailableDate: { $date: { $numberLong: tomorrowAt0Utc.toString() } }
            });
        } else if (request.Gift) {
            const inventoryChanges = updateCurrency(inventory, request.Gift.Cost, false);
            const gift = dialogue.Gifts.find(x => x.Item == request.Gift!.Item);
            if (gift) {
                gift.GiftedQuantity += 1;
            } else {
                dialogue.Gifts.push({ Item: request.Gift.Item, GiftedQuantity: 1 });
            }
            dialogue.AvailableGiftDate = new Date(tomorrowAt0Utc);
            await inventory.save();
            res.json({
                InventoryChanges: inventoryChanges,
                AvailableGiftDate: { $date: { $numberLong: tomorrowAt0Utc.toString() } }
            });
        } else {
            logger.error(`saveDialogue request not fully handled: ${String(req.body)}`);
        }
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
    Gift?: {
        Item: string;
        GainedChemistry: number;
        Cost: number;
        GiftedQuantity: number;
    };
    Booleans: string[];
    ResetBooleans: string[];
    Data?: ICompletedDialogue;
    OtherDialogueInfos: IOtherDialogueInfo[];
}

interface IOtherDialogueInfo {
    Dialogue: string;
    Tag: string;
    Value: number;
}

const getDialogue = (inventory: TInventoryDatabaseDocument, dialogueName: string): IDialogueDatabase => {
    let dialogue = inventory.DialogueHistory!.Dialogues!.find(x => x.DialogueName == dialogueName);
    if (!dialogue) {
        dialogue =
            inventory.DialogueHistory!.Dialogues![
                inventory.DialogueHistory!.Dialogues!.push({
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
                    DialogueName: dialogueName
                }) - 1
            ];
    }
    return dialogue;
};
