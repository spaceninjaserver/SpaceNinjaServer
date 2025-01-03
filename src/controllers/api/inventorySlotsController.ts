import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory, updateCurrency } from "@/src/services/inventoryService";
import { RequestHandler } from "express";
import { updateSlots } from "@/src/services/inventoryService";
import { InventorySlot } from "@/src/types/inventoryTypes/inventoryTypes";

/*
    loadout slots are additionally purchased slots only
    1 slot per mastery rank is automatically given above mr10, without database needing to save the mastery slots
    extra = everything above the base + 2 slots (e.g. for warframes)
    new slot = extra + 1 and slots +1
    using slot = slots -1, except for when purchased with platinum, then slots are included in price

    e.g. number of frames:
    19 slots, 71 extra
    = 71 - 19 + 2 = 54
    19 actually available slots in ingame inventory = 17 extra + 2 Base (base amount depends on slot) (+ 1 for every mastery rank above 10)
    number of frames = extra - slots + 2
*/

export const inventorySlotsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    //const body = JSON.parse(req.body as string) as IInventorySlotsRequest;

    //console.log(body);

    //TODO: check which slot was purchased because pvpBonus is also possible

    const inventory = await getInventory(accountId);
    const currencyChanges = updateCurrency(inventory, 20, true);
    updateSlots(inventory, InventorySlot.PVE_LOADOUTS, 1, 1);
    await inventory.save();

    //console.log({ InventoryChanges: currencyChanges }, " added loadout changes:");

    res.json({ InventoryChanges: currencyChanges });
};
