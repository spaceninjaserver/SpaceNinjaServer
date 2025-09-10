import type { RequestHandler } from "express";
import { ExportResources, ExportVirtuals } from "warframe-public-export-plus";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { addItem, getInventory } from "../../services/inventoryService.ts";
import { sendWsBroadcastToGame } from "../../services/wsService.ts";

export const unlockAllCapturaScenesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);

    let needSync = false;
    for (const uniqueName of Object.keys(ExportResources)) {
        if (resourceInheritsFrom(uniqueName, "/Lotus/Types/Items/MiscItems/PhotoboothTile")) {
            await addItem(inventory, uniqueName, 1);
            needSync = true;
        }
    }

    await inventory.save();
    res.end();
    if (needSync) {
        sendWsBroadcastToGame(accountId, { sync_inventory: true });
    }
};

const resourceInheritsFrom = (resourceName: string, targetName: string): boolean => {
    let parentName = resourceGetParent(resourceName);
    for (; parentName != undefined; parentName = resourceGetParent(parentName)) {
        if (parentName == targetName) {
            return true;
        }
    }
    return false;
};

const resourceGetParent = (resourceName: string): string | undefined => {
    if (resourceName in ExportResources) {
        return ExportResources[resourceName].parentName;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return ExportVirtuals[resourceName]?.parentName;
};
