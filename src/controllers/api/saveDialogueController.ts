import { addEmailItem, getDialogue, getInventory2, updateCredits } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { ICompletedDialogue, IDialogueCounter } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import type { RequestHandler } from "express";

export const saveDialogueController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = JSON.parse(String(req.body)) as SaveDialogueRequest;
    //logger.debug(`saveDialogue:`, request);
    if ("YearIteration" in request) {
        const inventory = await getInventory2(accountId, "DialogueHistory");
        inventory.DialogueHistory ??= {};
        inventory.DialogueHistory.YearIteration = request.YearIteration;
        await inventory.save();
        res.end();
    } else {
        const inventory = await getInventory2(
            accountId,
            "noKimCooldowns",
            "DialogueHistory",
            "accountOwnerId",
            "EmailItems",
            "AdultOperatorLoadOuts",
            "OperatorSuits",
            "infiniteCredits",
            "RegularCredits"
        );
        const inventoryChanges: IInventoryChanges = {};
        const tomorrowAt0Utc = inventory.noKimCooldowns
            ? Date.now()
            : (Math.trunc(Date.now() / 86400_000) + 1) * 86400_000;
        const dialogue = getDialogue(inventory, request.DialogueName);
        dialogue.Rank = request.Rank;
        dialogue.Chemistry += request.Chemistry;
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
        if (request.Counters) {
            dialogue.Counters ??= [];
            for (const clientCounter of request.Counters) {
                const dbCounter = dialogue.Counters.find(x => x.Name == clientCounter.Name);
                if (dbCounter) {
                    dbCounter.Count = clientCounter.Count;
                } else {
                    dialogue.Counters.push(clientCounter);
                }
            }
        }
        for (const info of request.OtherDialogueInfos) {
            const otherDialogue = getDialogue(inventory, info.Dialogue);
            if (info.Tag != "") {
                otherDialogue.QueuedDialogues.push(info.Tag);
            }
            otherDialogue.Chemistry += info.Value; // unsure
        }
        if (request.Data) {
            dialogue.Completed.push(request.Data);
            dialogue.AvailableDate = new Date(tomorrowAt0Utc);
            await inventory.save();
            res.json({
                InventoryChanges: inventoryChanges,
                AvailableDate: { $date: { $numberLong: tomorrowAt0Utc.toString() } }
            });
        } else if (request.Gift) {
            const inventoryChanges = updateCredits(inventory, request.Gift.Cost);
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
            res.end();
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
    Counters?: IDialogueCounter[];
    Data?: ICompletedDialogue;
    EventTriggered?: boolean; // U41
    OtherDialogueInfos: IOtherDialogueInfo[];
}

interface IOtherDialogueInfo {
    Dialogue: string;
    Tag: string;
    Value: number;
}
