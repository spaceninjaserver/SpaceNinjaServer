import { ItemType, toAddItemRequest } from "@/src/helpers/customHelpers/addItemHelpers";
import { getWeaponType } from "@/src/helpers/purchaseHelpers";
import { addPowerSuit, addWeapon } from "@/src/services/inventoryService";
import { RequestHandler } from "express";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const addItemController: RequestHandler = async (req, res) => {
    const request = toAddItemRequest(req.body);

    switch (request.type) {
        case ItemType.Powersuit:
            const powersuit = await addPowerSuit(request.InternalName, request.accountId);
            res.json(powersuit);
            return;
        case ItemType.Weapon:
            const weaponType = getWeaponType(request.InternalName);
            const weapon = await addWeapon(weaponType, request.InternalName, request.accountId);
            res.json(weapon);
            break;
        default:
            res.status(400).json({ error: "something went wrong" });
            break;
    }
};

export { addItemController };
