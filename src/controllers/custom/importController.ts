import { importInventory, importLoadOutPresets, importPersonalRooms } from "@/src/services/importService";
import { getInventory } from "@/src/services/inventoryService";
import { getLoadout } from "@/src/services/loadoutService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getPersonalRooms } from "@/src/services/personalRoomsService";
import { IInventoryClient } from "@/src/types/inventoryTypes/inventoryTypes";
import { IGetShipResponse } from "@/src/types/personalRoomsTypes";
import { RequestHandler } from "express";

export const importController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = req.body as IImportRequest;

    const inventory = await getInventory(accountId);
    importInventory(inventory, request.inventory);
    await inventory.save();

    if ("LoadOutPresets" in request.inventory && request.inventory.LoadOutPresets) {
        const loadout = await getLoadout(accountId);
        importLoadOutPresets(loadout, request.inventory.LoadOutPresets);
        await loadout.save();
    }

    if (
        request.inventory.Ship?.Rooms || // very old accounts may have Ship with { Features: [ ... ] }
        "Apartment" in request.inventory ||
        "TailorShop" in request.inventory
    ) {
        const personalRooms = await getPersonalRooms(accountId);
        importPersonalRooms(personalRooms, request.inventory);
        await personalRooms.save();
    }

    res.end();
};

interface IImportRequest {
    inventory: Partial<IInventoryClient> | Partial<IGetShipResponse>;
}
