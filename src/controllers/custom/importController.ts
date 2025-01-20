import { importInventory, importLoadOutPresets } from "@/src/services/importService";
import { getInventory } from "@/src/services/inventoryService";
import { getLoadout } from "@/src/services/loadoutService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IInventoryClient } from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";

export const importController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = JSON.parse(String(req.body)) as IImportRequest;

    const inventory = await getInventory(accountId);
    importInventory(inventory, request.inventory);
    await inventory.save();

    if (request.inventory.LoadOutPresets) {
        const loadout = await getLoadout(accountId);
        importLoadOutPresets(loadout, request.inventory.LoadOutPresets);
        await loadout.save();
    }

    res.end();
};

interface IImportRequest {
    inventory: IInventoryClient;
}
