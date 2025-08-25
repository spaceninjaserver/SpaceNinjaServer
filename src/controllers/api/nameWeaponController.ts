import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory, updateCurrency } from "../../services/inventoryService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import type { TEquipmentKey } from "../../types/inventoryTypes/inventoryTypes.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";

interface INameWeaponRequest {
    ItemName: string;
}

export const nameWeaponController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const body = getJSONfromString<INameWeaponRequest>(String(req.body));
    const item = inventory[req.query.Category as string as TEquipmentKey].id(req.query.ItemId as string)!;
    if (body.ItemName != "") {
        item.ItemName = body.ItemName;
    } else {
        item.ItemName = undefined;
    }
    const currencyChanges = updateCurrency(
        inventory,
        req.query.Category == "Horses" || "webui" in req.query ? 0 : 15,
        true
    );
    await inventory.save();
    res.json({
        InventoryChanges: currencyChanges
    });
    sendWsBroadcastTo(accountId, { update_inventory: true });
};
