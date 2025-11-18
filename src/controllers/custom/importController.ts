import { importInventory, importLoadOutPresets, importPersonalRooms } from "../../services/importService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getLoadout } from "../../services/loadoutService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getPersonalRooms } from "../../services/personalRoomsService.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import type { IInventoryClient } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { IGetShipResponse } from "../../types/personalRoomsTypes.ts";
import type { RequestHandler } from "express";

export const importController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = req.body as IImportRequest;

    let anyKnownKey = false;
    try {
        const inventory = await getInventory(accountId);
        if (importInventory(inventory, request.inventory)) {
            anyKnownKey = true;
            await inventory.save();
        }

        if ("LoadOutPresets" in request.inventory && request.inventory.LoadOutPresets) {
            anyKnownKey = true;
            const loadout = await getLoadout(accountId);
            importLoadOutPresets(loadout, request.inventory.LoadOutPresets);
            await loadout.save();
        }

        if (
            request.inventory.Ship?.Rooms || // very old accounts may have Ship with { Features: [ ... ] }
            "Apartment" in request.inventory ||
            "TailorShop" in request.inventory
        ) {
            anyKnownKey = true;
            const personalRooms = await getPersonalRooms(accountId);
            importPersonalRooms(personalRooms, request.inventory);
            await personalRooms.save();
        }

        if (!anyKnownKey) {
            res.send("noKnownKey").end();
        }

        broadcastInventoryUpdate(req);
    } catch (e) {
        console.error(e);
        res.send((e as Error).message);
    }
    res.end();
};

interface IImportRequest {
    inventory: Partial<IInventoryClient> | Partial<IGetShipResponse>;
}
