import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import type { IInventoryClient, IDialogueResetDateClient } from "../../types/inventoryTypes/inventoryTypes.ts";
import { unixTimesInMs } from "../../constants/timeConstants.ts";

export const clearDialogueHistoryController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "DialogueHistory noKimCooldowns");
    const request = JSON.parse(String(req.body)) as IClearDialogueRequest;
    //logger.debug(`clearDialogueHistory:`, request);
    if (inventory.DialogueHistory && inventory.DialogueHistory.Dialogues) {
        inventory.DialogueHistory.Resets ??= 0;
        inventory.DialogueHistory.Resets += 1;

        if (request.Pack) {
            inventory.DialogueHistory.ResetDates ??= [];
            let resetDate = inventory.DialogueHistory.ResetDates.find(x => x.Pack == request.Pack);
            if (!resetDate) {
                resetDate =
                    inventory.DialogueHistory.ResetDates[
                        inventory.DialogueHistory.ResetDates.push({
                            Date: new Date(0),
                            Resets: 0,
                            Pack: request.Pack
                        }) - 1
                    ];
            }
            resetDate.Date = inventory.noKimCooldowns ? new Date() : new Date(Date.now() + 28 * unixTimesInMs.day);
            resetDate.Resets += 1;
        }

        for (const dialogueName of request.Dialogues) {
            const index = inventory.DialogueHistory.Dialogues.findIndex(x => x.DialogueName == dialogueName);
            if (index != -1) {
                if (request.ClearPersist) {
                    inventory.DialogueHistory.Dialogues.splice(index, 1);
                } else {
                    inventory.DialogueHistory.Dialogues[index] = {
                        ...inventory.DialogueHistory.Dialogues[index],
                        Counters: inventory.DialogueHistory.Dialogues[index].Counters?.filter(x => x.Persist),
                        Completed: inventory.DialogueHistory.Dialogues[index].Completed.filter(x => x.Persist)
                    };
                }
            }
        }
    }
    await inventory.save();
    res.json({
        ResetDate: inventory.toJSON<IInventoryClient>().DialogueHistory?.ResetDates?.find(x => x.Pack == request.Pack),
        Dialogues: request.Dialogues,
        ClearPersist: request.ClearPersist
    } satisfies IClearDialogueResponse);
    res.end();
};

interface IClearDialogueRequest {
    Dialogues: string[];
    Pack?: "Hex" | "Roundtable" | "Triad"; // U41
    ClearPersist?: boolean; // U41
}

interface IClearDialogueResponse {
    ResetDate?: IDialogueResetDateClient; // U41
    Dialogues?: string[]; // U41
    ClearPersist?: boolean; // U41
}
