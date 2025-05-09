import { applyClientEquipmentUpdates, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IOid } from "@/src/types/commonTypes";
import { IEquipmentClient } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";
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
};

type IAddXpRequest = {
    [_ in TEquipmentKey]: IEquipmentClient[];
};
