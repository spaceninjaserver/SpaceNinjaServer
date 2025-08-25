import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory, updateCurrency, updateSlots } from "@/src/services/inventoryService";
import type { RequestHandler } from "express";
import { InventorySlot } from "@/src/types/inventoryTypes/inventoryTypes";
import { exhaustive } from "@/src/utils/ts-utils";

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
    const body = JSON.parse(req.body as string) as IInventorySlotsRequest;

    let price;
    let amount;
    switch (body.Bin) {
        case InventorySlot.SUITS:
        case InventorySlot.MECHSUITS:
        case InventorySlot.PVE_LOADOUTS:
        case InventorySlot.CREWMEMBERS:
            price = 20;
            amount = 1;
            break;

        case InventorySlot.SPACESUITS:
            price = 12;
            amount = 1;
            break;

        case InventorySlot.WEAPONS:
        case InventorySlot.SPACEWEAPONS:
        case InventorySlot.SENTINELS:
        case InventorySlot.RJ_COMPONENT_AND_ARMAMENTS:
        case InventorySlot.AMPS:
            price = 12;
            amount = 2;
            break;

        case InventorySlot.RIVENS:
            price = 60;
            amount = 3;
            break;

        default:
            exhaustive(body.Bin);
            throw new Error(`unexpected slot purchase of type ${body.Bin as string}`);
    }

    const inventory = await getInventory(accountId);
    const currencyChanges = updateCurrency(inventory, price, true);
    updateSlots(inventory, body.Bin, amount, amount);
    await inventory.save();

    res.json({ InventoryChanges: currencyChanges });
};

interface IInventorySlotsRequest {
    Bin: InventorySlot;
}
