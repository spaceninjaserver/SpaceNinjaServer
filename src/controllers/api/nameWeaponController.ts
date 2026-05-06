import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory2, updatePlatinum } from "../../services/inventoryService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import type { TEquipmentKey } from "../../types/inventoryTypes/inventoryTypes.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

interface INameWeaponRequest {
    ItemName: string;
}

export const nameWeaponController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const category = req.query.Category as string as TEquipmentKey;
    const inventory = await getInventory2(
        accountId,
        category,
        "infinitePlatinum",
        "PremiumCredits",
        "PremiumCreditsFree"
    );
    const body = getJSONfromString<INameWeaponRequest>(String(req.body));
    const item = inventory[category].id(req.query.ItemId as string)!;
    if (body.ItemName != "") {
        item.ItemName = body.ItemName;
    } else {
        item.ItemName = undefined;
    }
    const currencyChanges = updatePlatinum(inventory, req.query.Category == "Horses" || "webui" in req.query ? 0 : 15);
    await inventory.save();
    res.json({
        InventoryChanges: currencyChanges
    });
    broadcastInventoryUpdate(req);
};
