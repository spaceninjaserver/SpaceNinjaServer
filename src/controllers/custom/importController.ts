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
        importInventory(inventory, request.inventory);
        if (inventory.isModified()) {
            anyKnownKey = true;
            await inventory.save();
        }

        if ("LoadOutPresets" in request.inventory && request.inventory.LoadOutPresets) {
            const loadout = await getLoadout(accountId);
            importLoadOutPresets(loadout, request.inventory.LoadOutPresets);
            if (loadout.isModified()) {
                anyKnownKey = true;
                await loadout.save();
            }
        }

        if (
            request.inventory.Ship?.Rooms || // very old accounts may have Ship with { Features: [ ... ] }
            "Apartment" in request.inventory ||
            "TailorShop" in request.inventory
        ) {
            const personalRooms = await getPersonalRooms(accountId);
            importPersonalRooms(personalRooms, request.inventory);
            if (personalRooms.isModified()) {
                anyKnownKey = true;
                await personalRooms.save();
            }
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
