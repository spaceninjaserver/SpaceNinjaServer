import { BL_LATEST } from "../../constants/gameVersions.ts";
import { applyClientEquipmentUpdates, getInventory2 } from "../../services/inventoryService.ts";
import { getMaxLevelCap } from "../../services/itemDataService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import type { IOid } from "../../types/commonTypes.ts";
import type { IEquipmentClient } from "../../types/equipmentTypes.ts";
import type { TEquipmentKey } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";

export const addXpController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = req.body as IAddXpRequest;
    const inventory = await getInventory2(
        accountId,
        "XPInfo",
        "infiniteRevives",
        ...(Object.keys(request) as TEquipmentKey[])
    );
    for (const [category, gear] of Object.entries(request)) {
        for (const clientItem of gear) {
            const dbItem = inventory[category as TEquipmentKey].id((clientItem.ItemId as IOid).$oid);
            if (dbItem) {
                if (getMaxLevelCap(dbItem.ItemType) > 30) {
                    if ((dbItem.Polarized ?? 0) < 5) {
                        dbItem.Polarized = 5;
                    }
                }
            }
        }
        applyClientEquipmentUpdates(inventory, gear, category as TEquipmentKey, BL_LATEST);
    }
    await inventory.save();
    res.end();
    broadcastInventoryUpdate(req);
};

type IAddXpRequest = {
    [_ in TEquipmentKey]: IEquipmentClient[];
};
