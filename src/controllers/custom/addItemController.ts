import { getAccountIdForRequest } from "@/src/services/loginService";
import { ItemType, toAddItemRequest } from "@/src/helpers/customHelpers/addItemHelpers";
import { getWeaponType } from "@/src/services/itemDataService";
import { addPowerSuit, addEquipment, getInventory } from "@/src/services/inventoryService";
import { RequestHandler } from "express";

const addItemController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = toAddItemRequest(req.body);

    switch (request.type) {
        case ItemType.Powersuit: {
            const inventory = await getInventory(accountId);
            const inventoryChanges = addPowerSuit(inventory, request.InternalName);
            await inventory.save();
            res.json(inventoryChanges);
            return;
        }
        case ItemType.Weapon: {
            const inventory = await getInventory(accountId);
            const weaponType = getWeaponType(request.InternalName);
            const inventoryChanges = addEquipment(inventory, weaponType, request.InternalName);
            await inventory.save();
            res.json(inventoryChanges);
            break;
        }
        default:
            res.status(400).json({ error: "something went wrong" });
            break;
    }
};

export { addItemController };
