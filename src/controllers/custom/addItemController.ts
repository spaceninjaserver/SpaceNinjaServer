import { getAccountIdForRequest } from "@/src/services/loginService";
import { ItemType, toAddItemRequest } from "@/src/helpers/customHelpers/addItemHelpers";
import { getWeaponType } from "@/src/services/itemDataService";
import { addPowerSuit, addEquipment } from "@/src/services/inventoryService";
import { RequestHandler } from "express";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const addItemController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = toAddItemRequest(req.body);

    switch (request.type) {
        case ItemType.Powersuit:
            const powersuit = await addPowerSuit(request.InternalName, accountId);
            res.json(powersuit);
            return;
        case ItemType.Weapon:
            const weaponType = getWeaponType(request.InternalName);
            const weapon = await addEquipment(weaponType, request.InternalName, accountId);
            res.json(weapon);
            break;
        default:
            res.status(400).json({ error: "something went wrong" });
            break;
    }
};

export { addItemController };
