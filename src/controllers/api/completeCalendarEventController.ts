import { getCalendarProgress, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { handleStoreItemAcquisition } from "@/src/services/purchaseService";
import { getWorldState } from "@/src/services/worldStateService";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { RequestHandler } from "express";

// GET request; query parameters: CompletedEventIdx=0&Iteration=4&Version=19&Season=CST_SUMMER
export const completeCalendarEventController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const calendarProgress = getCalendarProgress(inventory);
    const currentSeason = getWorldState().KnownCalendarSeasons[0];
    let inventoryChanges: IInventoryChanges = {};
    let dayIndex = 0;
    for (const day of currentSeason.Days) {
        if (day.events.length == 0 || day.events[0].type != "CET_CHALLENGE") {
            if (dayIndex == calendarProgress.SeasonProgress.LastCompletedDayIdx) {
                if (day.events.length != 0) {
                    const selection = day.events[parseInt(req.query.CompletedEventIdx as string)];
                    if (selection.type == "CET_REWARD") {
                        inventoryChanges = (await handleStoreItemAcquisition(selection.reward!, inventory))
                            .InventoryChanges;
                    } else if (selection.type == "CET_UPGRADE") {
                        calendarProgress.YearProgress.Upgrades.push(selection.upgrade!);
                    } else if (selection.type != "CET_PLOT") {
                        throw new Error(`unexpected selection type: ${selection.type}`);
                    }
                }
                break;
            }
            ++dayIndex;
        }
    }
    calendarProgress.SeasonProgress.LastCompletedDayIdx++;
    await inventory.save();
    res.json({
        InventoryChanges: inventoryChanges,
        CalendarProgress: inventory.CalendarProgress
    });
};
