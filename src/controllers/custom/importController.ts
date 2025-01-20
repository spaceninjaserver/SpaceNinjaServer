import { importInventory } from "@/src/services/importService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IInventoryClient } from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";

export const importController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const request = JSON.parse(String(req.body)) as IImportRequest;
    importInventory(inventory, request.inventory);
    await inventory.save();
    res.end();
};

interface IImportRequest {
    inventory: IInventoryClient;
}
