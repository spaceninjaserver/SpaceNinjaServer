import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { EquipmentFeatures } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";

export const gildEquipmentController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = req.body as IGildEquipmentRequest;
    const inventory = await getInventory(accountId, request.Category);
    const weapon = inventory[request.Category].id(request.ItemId);
    if (weapon) {
        weapon.Features ??= 0;
        weapon.Features |= EquipmentFeatures.GILDED;
        await inventory.save();
    }
    res.end();
};

type IGildEquipmentRequest = {
    ItemId: string;
    Category: TEquipmentKey;
};
