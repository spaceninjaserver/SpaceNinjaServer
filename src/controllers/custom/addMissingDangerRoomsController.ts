import type { RequestHandler } from "express";
import { ExportResources } from "warframe-public-export-plus";
import { addMiscItems, getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

// All Simulacrum tiles, plus the key that gives access to the Simulacrum itself
const dangerRoomItems = [
    ...Object.entries(ExportResources)
        .filter(([, item]) => item.parentName == "/Lotus/Types/Items/DangerRoom/DangerRoomTile")
        .map(([uniqueName]) => uniqueName),
    "/Lotus/Types/Items/MiscItems/DangerRoomKey"
];

export const addMissingDangerRoomsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "MiscItems");
    const missing = dangerRoomItems.filter(
        itemType => !inventory.MiscItems.some(item => item.ItemType == itemType && item.ItemCount > 0)
    );
    if (missing.length != 0) {
        addMiscItems(
            inventory,
            missing.map(ItemType => ({ ItemType, ItemCount: 1 }))
        );
        await inventory.save();
        broadcastInventoryUpdate(req);
    }
    res.json({ count: missing.length });
};
