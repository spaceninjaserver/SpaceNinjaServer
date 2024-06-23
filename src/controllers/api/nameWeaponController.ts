import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory, updateCurrency } from "@/src/services/inventoryService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";

interface INameWeaponRequest {
    ItemName: string;
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const nameWeaponController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const body = getJSONfromString(String(req.body)) as INameWeaponRequest;
    const item = inventory[req.query.Category as string as TEquipmentKey].find(
        item => item._id.toString() == (req.query.ItemId as string)
    )!;
    if (body.ItemName != "") {
        item.ItemName = body.ItemName;
    } else {
        item.ItemName = undefined;
    }
    await inventory.save();
    res.json({
        InventoryChanges: await updateCurrency("webui" in req.query ? 0 : 15, true, accountId)
    });
};
