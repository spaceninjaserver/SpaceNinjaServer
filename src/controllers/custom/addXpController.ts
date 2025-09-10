import { applyClientEquipmentUpdates, getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import type { IOid } from "../../types/commonTypes.ts";
import type { IEquipmentClient } from "../../types/equipmentTypes.ts";
import type { TEquipmentKey } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";
import { ExportMisc } from "warframe-public-export-plus";

export const addXpController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const request = req.body as IAddXpRequest;
    for (const [category, gear] of Object.entries(request)) {
        for (const clientItem of gear) {
            const dbItem = inventory[category as TEquipmentKey].id((clientItem.ItemId as IOid).$oid);
            if (dbItem) {
                if (dbItem.ItemType in ExportMisc.uniqueLevelCaps) {
                    if ((dbItem.Polarized ?? 0) < 5) {
                        dbItem.Polarized = 5;
                    }
                }
            }
        }
        applyClientEquipmentUpdates(inventory, gear, category as TEquipmentKey);
    }
    await inventory.save();
    res.end();
    broadcastInventoryUpdate(req);
};

type IAddXpRequest = {
    [_ in TEquipmentKey]: IEquipmentClient[];
};
