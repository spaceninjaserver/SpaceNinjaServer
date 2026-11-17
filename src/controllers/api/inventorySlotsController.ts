import { getAccountForRequest, getBuildVersion } from "../../services/loginService.ts";
import { getInventory2, updatePlatinum, updateSlots } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import { eInventorySlot, type TInventorySlot } from "../../types/inventoryTypes/inventoryTypes.ts";
import { exhaustive } from "../../utils/ts-utils.ts";
import gameToBuildVersionInt from "../../constants/gameToBuildVersionInt.ts";

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
    const account = await getAccountForRequest(req);
    const accountId = account._id.toString();
    const buildVersion = getBuildVersion(req, account);
    const body = JSON.parse(req.body as string) as IInventorySlotsRequest;

    let price;
    let amount;
    switch (body.Bin) {
        case eInventorySlot.SUITS:
        case eInventorySlot.MECHSUITS:
        case eInventorySlot.PVE_LOADOUTS:
        case eInventorySlot.PVP_LOADOUTS:
        case eInventorySlot.CREWMEMBERS:
            price = 20;
            amount = 1;
            break;

        case eInventorySlot.SPACESUITS:
            price = 12;
            amount = 1;
            break;

        case eInventorySlot.WEAPONS:
        case eInventorySlot.SPACEWEAPONS:
        case eInventorySlot.SENTINELS:
        case eInventorySlot.RJ_COMPONENT_AND_ARMAMENTS:
        case eInventorySlot.AMPS:
            price = 12;
            amount = 2;
            break;

        case eInventorySlot.RIVENS:
            price = 60;
            amount = 3;
            break;

        case eInventorySlot.PETS:
            price = 10;
            amount = 1;
            break;

        default:
            exhaustive(body.Bin);
            throw new Error(`unexpected slot purchase of type ${body.Bin as string}`);
    }

    const inventory = await getInventory2<
        TInventorySlot | "infinitePlatinum" | "PremiumCredits" | "PremiumCreditsFree"
    >(accountId, body.Bin, "infinitePlatinum", "PremiumCredits", "PremiumCreditsFree");
    const currencyChanges = updatePlatinum(inventory, price);
    updateSlots(inventory, body.Bin, amount, amount);
    await inventory.save();

    if (buildVersion >= gameToBuildVersionInt["23.0.0"]) {
        res.json({ InventoryChanges: currencyChanges });
        return;
    }

    // U11-U22 require a different response.
    if (buildVersion > gameToBuildVersionInt["10.8.0"]) {
        res.json({
            PremiumCredits: inventory.infinitePlatinum ? 999999999 : inventory.PremiumCredits,
            PremiumCreditsFree: inventory.infinitePlatinum ? 0 : inventory.PremiumCreditsFree
        });
        return;
    }

    // Builds older than U11 hard-code the platinum subtraction in the UI and don't require a json response.
    res.status(200).end();
};

interface IInventorySlotsRequest {
    Bin: TInventorySlot;
}
