import { getAccountIdForRequest } from "@/src/services/loginService";
import { addEquipment, addPowerSuit, addMechSuit, getInventory, updateSlots } from "@/src/services/inventoryService";
import { SlotNames } from "@/src/types/purchaseTypes";
import { InventorySlot } from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";

export const addItemsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const requests = req.body as IAddItemRequest[];
    const inventory = await getInventory(accountId);
    for (const request of requests) {
        updateSlots(inventory, productCategoryToSlotName[request.type], 0, 1);
        switch (request.type) {
            case ItemType.Suits:
                addPowerSuit(inventory, request.internalName);
                break;

            case ItemType.MechSuits:
                addMechSuit(inventory, request.internalName);
                break;

            default:
                addEquipment(inventory, request.type, request.internalName);
                break;
        }
    }
    await inventory.save();
    res.end();
};

const productCategoryToSlotName: Record<ItemType, SlotNames> = {
    Suits: InventorySlot.SUITS,
    Pistols: InventorySlot.WEAPONS,
    Melee: InventorySlot.WEAPONS,
    LongGuns: InventorySlot.WEAPONS,
    SpaceSuits: InventorySlot.SPACESUITS,
    SpaceGuns: InventorySlot.SPACESUITS,
    SpaceMelee: InventorySlot.SPACESUITS,
    Sentinels: InventorySlot.SENTINELS,
    SentinelWeapons: InventorySlot.SENTINELS,
    MechSuits: InventorySlot.MECHSUITS
};

enum ItemType {
    Suits = "Suits",
    SpaceSuits = "SpaceSuits",
    LongGuns = "LongGuns",
    Pistols = "Pistols",
    Melee = "Melee",
    SpaceGuns = "SpaceGuns",
    SpaceMelee = "SpaceMelee",
    SentinelWeapons = "SentinelWeapons",
    Sentinels = "Sentinels",
    MechSuits = "MechSuits"
}

interface IAddItemRequest {
    type: ItemType;
    internalName: string;
}
