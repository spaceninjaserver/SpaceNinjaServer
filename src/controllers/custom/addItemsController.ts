import { getAccountIdForRequest } from "@/src/services/loginService";
import { getWeaponType } from "@/src/services/itemDataService";
import { addPowerSuit, addEquipment, getInventory } from "@/src/services/inventoryService";
import { RequestHandler } from "express";

export const addItemsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const requests = req.body as IAddItemRequest[];
    const inventory = await getInventory(accountId);
    for (const request of requests) {
        switch (request.type) {
            case ItemType.Powersuit:
                addPowerSuit(inventory, request.internalName);
                break;

            case ItemType.Weapon:
                addEquipment(inventory, getWeaponType(request.internalName), request.internalName);
                break;
        }
    }
    await inventory.save();
    res.end();
};

enum ItemType {
    Powersuit = "Powersuit",
    Weapon = "Weapon"
}

interface IAddItemRequest {
    type: ItemType;
    internalName: string;
}