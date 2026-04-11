import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import type { TEquipmentKey } from "../../types/inventoryTypes/inventoryTypes.ts";

export const removeItemsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const category = req.query.category as
        | TEquipmentKey
        | "WeaponSkins"
        | "ShipDecorations"
        | "FlavourItems"
        | "QuestKeys"
        | undefined;
    if (category) {
        const inventory = await getInventory(accountId, category);
        if (category in inventory) {
            inventory.set(category, []);
            await inventory.save();
            broadcastInventoryUpdate(req);
        }
    }
    res.end();
};
