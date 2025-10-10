import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";

export const forceRemoveItemController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "MiscItems");
    const body = getJSONfromString<IForceRemoveItemRequest>(String(req.body));
    const inventoryChanges: IInventoryChanges = {};
    for (const item of body.items) {
        const index = inventory.MiscItems.findIndex(x => x.ItemType == item);
        if (index != -1) {
            inventoryChanges.MiscItems ??= [];
            inventoryChanges.MiscItems.push({ ItemType: item, ItemCount: inventory.MiscItems[index].ItemCount * -1 });

            inventory.MiscItems.splice(index, 1);
        }
    }
    await inventory.save();
    res.json({ InventoryChanges: inventoryChanges });
};

interface IForceRemoveItemRequest {
    items: string[];
}
