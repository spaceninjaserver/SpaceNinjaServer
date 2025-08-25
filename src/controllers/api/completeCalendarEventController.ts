import { checkCalendarAutoAdvance, getCalendarProgress, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { handleStoreItemAcquisition } from "@/src/services/purchaseService";
import { getWorldState } from "@/src/services/worldStateService";
import type { IInventoryChanges } from "@/src/types/purchaseTypes";
import type { RequestHandler } from "express";

// GET request; query parameters: CompletedEventIdx=0&Iteration=4&Version=19&Season=CST_SUMMER
export const completeCalendarEventController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const calendarProgress = getCalendarProgress(inventory);
    const currentSeason = getWorldState().KnownCalendarSeasons[0];
    let inventoryChanges: IInventoryChanges = {};
    const dayIndex = calendarProgress.SeasonProgress.LastCompletedDayIdx + 1;
    const day = currentSeason.Days[dayIndex];
    if (day.events.length != 0) {
        if (day.events[0].type == "CET_CHALLENGE") {
            throw new Error(`completeCalendarEvent should not be used for challenges`);
        }
        const selection = day.events[parseInt(req.query.CompletedEventIdx as string)];
        if (selection.type == "CET_REWARD") {
            inventoryChanges = (await handleStoreItemAcquisition(selection.reward!, inventory)).InventoryChanges;
        } else if (selection.type == "CET_UPGRADE") {
            calendarProgress.YearProgress.Upgrades.push(selection.upgrade!);
        } else if (selection.type != "CET_PLOT") {
            throw new Error(`unexpected selection type: ${selection.type}`);
        }
    }
    calendarProgress.SeasonProgress.LastCompletedDayIdx = dayIndex;
    checkCalendarAutoAdvance(inventory, currentSeason);
    await inventory.save();
    res.json({
        InventoryChanges: inventoryChanges,
        CalendarProgress: inventory.CalendarProgress
    });
};
