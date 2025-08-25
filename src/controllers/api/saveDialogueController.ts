import { addEmailItem, getDialogue, getInventory, updateCurrency } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import type { ICompletedDialogue } from "@/src/types/inventoryTypes/inventoryTypes";
import type { IInventoryChanges } from "@/src/types/purchaseTypes";
import type { RequestHandler } from "express";

export const saveDialogueController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = JSON.parse(String(req.body)) as SaveDialogueRequest;
    if ("YearIteration" in request) {
        const inventory = await getInventory(accountId, "DialogueHistory noKimCooldowns");
        inventory.DialogueHistory ??= {};
        inventory.DialogueHistory.YearIteration = request.YearIteration;
        await inventory.save();
        res.end();
    } else {
        const inventory = await getInventory(accountId);
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
    Data?: ICompletedDialogue;
    OtherDialogueInfos: IOtherDialogueInfo[];
}

interface IOtherDialogueInfo {
    Dialogue: string;
    Tag: string;
    Value: number;
}
