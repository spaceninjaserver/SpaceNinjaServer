import { addMiscItems, combineInventoryChanges, getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getPersonalRooms } from "../../services/personalRoomsService.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import { logger } from "../../utils/logger.ts";
import type { RequestHandler } from "express";

export const setShipVignetteController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "MiscItems");
    const personalRooms = await getPersonalRooms(accountId);
    const body = JSON.parse(String(req.body)) as ISetShipVignetteRequest;
    personalRooms.Ship.Wallpaper = body.Wallpaper;
    personalRooms.Ship.Vignette = body.Vignette;
    personalRooms.Ship.VignetteFish ??= [];
    const inventoryChanges: IInventoryChanges = {};
    for (let i = 0; i != body.Fish.length; ++i) {
        if (body.Fish[i] && !personalRooms.Ship.VignetteFish[i]) {
            logger.debug(`moving ${body.Fish[i]} from inventory to vignette slot ${i}`);
            const miscItemsDelta = [{ ItemType: body.Fish[i], ItemCount: -1 }];
            addMiscItems(inventory, miscItemsDelta);
            combineInventoryChanges(inventoryChanges, { MiscItems: miscItemsDelta });
        } else if (personalRooms.Ship.VignetteFish[i] && !body.Fish[i]) {
            logger.debug(`moving ${personalRooms.Ship.VignetteFish[i]} from vignette slot ${i} to inventory`);
            const miscItemsDelta = [{ ItemType: personalRooms.Ship.VignetteFish[i], ItemCount: +1 }];
            addMiscItems(inventory, miscItemsDelta);
            combineInventoryChanges(inventoryChanges, { MiscItems: miscItemsDelta });
        }
    }
    personalRooms.Ship.VignetteFish = body.Fish;
    if (body.VignetteDecos.length) {
        logger.error(`setShipVignette request not fully handled:`, body);
    }
    await Promise.all([inventory.save(), personalRooms.save()]);
    res.json({
        Wallpaper: body.Wallpaper,
        Vignette: body.Vignette,
        VignetteFish: body.Fish,
        InventoryChanges: inventoryChanges
    });
};

interface ISetShipVignetteRequest {
    Wallpaper: string;
    Vignette: string;
    Fish: string[];
    VignetteDecos: unknown[];
}
