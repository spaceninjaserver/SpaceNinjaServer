import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory, addEquipment, occupySlot, productCategoryToInventoryBin } from "@/src/services/inventoryService";
import { RequestHandler } from "express";
import { modularWeaponTypes } from "@/src/helpers/modularWeaponHelper";

export const addModularEquipmentController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = req.body as IAddModularEquipmentRequest;
    const category = modularWeaponTypes[request.ItemType];
    const inventoryBin = productCategoryToInventoryBin(category)!;
    const inventory = await getInventory(accountId, `${category} ${inventoryBin}`);
    addEquipment(inventory, category, request.ItemType, request.ModularParts);
    occupySlot(inventory, inventoryBin, true);
    await inventory.save();
    res.end();
};

interface IAddModularEquipmentRequest {
    ItemType: string;
    ModularParts: string[];
}
