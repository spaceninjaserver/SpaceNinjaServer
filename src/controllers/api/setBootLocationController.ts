import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getPersonalRooms } from "@/src/services/personalRoomsService";
import { TBootLocation } from "@/src/types/shipTypes";
import { getInventory } from "@/src/services/inventoryService";

export const setBootLocationController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const personalRooms = await getPersonalRooms(accountId);
    personalRooms.Ship.BootLocation = req.query.bootLocation as string as TBootLocation;
    await personalRooms.save();

    if (personalRooms.Ship.BootLocation == "SHOP") {
        // Temp fix so the motorcycle in the backroom doesn't appear broken.
        // This code may be removed when quests are fully implemented.
        const inventory = await getInventory(accountId);
        if (inventory.Motorcycles.length == 0) {
            inventory.Motorcycles.push({ ItemType: "/Lotus/Types/Vehicles/Motorcycle/MotorcyclePowerSuit" });
            await inventory.save();
        }
    }

    res.end();
};
