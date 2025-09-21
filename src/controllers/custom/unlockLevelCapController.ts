import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { TEquipmentKey } from "../../types/inventoryTypes/inventoryTypes.ts";

export const unlockLevelCapController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = req.body as IunlockLevelCapRequest;
    const inventory = await getInventory(accountId, data.Category);
    const equipment = inventory[data.Category].id(data.ItemId)!;

    equipment.Polarized ??= 0;
    equipment.Polarized = data.Polarized;

    await inventory.save();
    res.end();
    broadcastInventoryUpdate(req);
};

interface IunlockLevelCapRequest {
    Category: TEquipmentKey;
    ItemId: string;
    Polarized: number;
}
