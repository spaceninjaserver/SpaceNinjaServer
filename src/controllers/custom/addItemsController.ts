import { getAccountIdForRequest } from "@/src/services/loginService";
import { addEquipment, addPowerSuit, getInventory, updateSlots } from "@/src/services/inventoryService";
import { productCategoryToSlotName } from "@/src/helpers/purchaseHelpers";
import { RequestHandler } from "express";

export const addItemsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const requests = req.body as IAddItemRequest[];
    const inventory = await getInventory(accountId);
    for (const request of requests) {
        switch (request.type) {
            case ItemType.Suits:
                updateSlots(inventory, productCategoryToSlotName[request.type], 0, 1);
                addPowerSuit(inventory, request.internalName);
                break;

            default:
                updateSlots(inventory, productCategoryToSlotName[request.type], 0, 1);
                addEquipment(inventory, request.type, request.internalName);
                break;
        }
    }
    await inventory.save();
    res.end();
};

enum ItemType {
    Suits = "Suits",
    SpaceSuits = "SpaceSuits",
    Pistols = "Pistols",
    Melee = "Melee",
    SpaceGuns = "SpaceGuns",
    SpaceMelee = "SpaceMelee",
    SentinelWeapons = "SentinelWeapons",
    Sentinels = "Sentinels"
}

interface IAddItemRequest {
    type: ItemType;
    internalName: string;
}
