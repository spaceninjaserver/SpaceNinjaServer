import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, hasPermission } from "../../services/loginService.ts";
import { getPersonalRooms } from "../../services/personalRoomsService.ts";
import type { RequestHandler } from "express";
import { getInventoryResponse } from "../api/inventoryController.ts";
import { BL_LATEST } from "../../constants/gameVersions.ts";

export const exportController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!hasPermission(account, "export")) {
        res.status(500).send(`Permission denied`).end();
        return;
    }

    try {
        const [inventory, personalRooms] = await Promise.all([
            getInventory(account._id, undefined),
            getPersonalRooms(account._id, "-__v -_id -personalRoomsOwnerId -activeShipId")
        ]);
        const inventoryResponse = await getInventoryResponse(req, inventory, false, BL_LATEST, false, true);

        res.json({
            ...inventoryResponse,
            ...personalRooms.toJSON()
        });
    } catch (e) {
        console.error(e);
        res.send((e as Error).message);
    }
    res.end();
};
