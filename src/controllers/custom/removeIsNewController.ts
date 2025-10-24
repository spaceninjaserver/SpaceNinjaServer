import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import { equipmentKeys } from "../../types/inventoryTypes/inventoryTypes.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const removeIsNewController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const filteredEquipmentKeys = equipmentKeys.filter(k => k !== "CrewShipWeapons" && k !== "CrewShipSalvagedWeapons");
    const inventory = await getInventory(accountId, [...filteredEquipmentKeys, "WeaponSkins"].join(" "));
    for (const key of filteredEquipmentKeys) {
        if (key in inventory) {
            for (const equipment of inventory[key]) {
                if (equipment.IsNew) equipment.IsNew = false;
            }
        }
    }
    for (const equipment of inventory.WeaponSkins) {
        if (equipment.IsNew) equipment.IsNew = false;
    }
    await inventory.save();
    res.end();
    broadcastInventoryUpdate(req);
};
