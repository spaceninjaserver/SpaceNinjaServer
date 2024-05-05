import { RequestHandler } from "express";
import { IUpgradesRequest } from "@/src/types/requestTypes";
import { IGenericItemDatabase, IMiscItem, TGenericItemKey } from "@/src/types/inventoryTypes/inventoryTypes";
import { addMiscItems, getInventory } from "@/src/services/inventoryService";

export const upgradesController: RequestHandler = async (req, res) => {
    const accountId = req.query.accountId as string;
    const payload = JSON.parse(req.body.toString()) as IUpgradesRequest;
    const inventory = await getInventory(accountId);
    for (const operation of payload.Operations) {
        addMiscItems(inventory, [
            {
                ItemType: operation.UpgradeRequirement,
                ItemCount: -1
            } satisfies IMiscItem
        ]);
        switch (operation.UpgradeRequirement) {
            case "/Lotus/Types/Items/MiscItems/OrokinReactor":
            case "/Lotus/Types/Items/MiscItems/OrokinCatalyst":
                for (const item of inventory[payload.ItemCategory as TGenericItemKey] as IGenericItemDatabase[]) {
                    if (item._id.toString() == payload.ItemId.$oid) {
                        item.Features ??= 0;
                        item.Features |= 1;
                        break;
                    }
                }
                break;
            case "/Lotus/Types/Items/MiscItems/UtilityUnlocker":
            case "/Lotus/Types/Items/MiscItems/WeaponUtilityUnlocker":
                for (const item of inventory[payload.ItemCategory as TGenericItemKey] as IGenericItemDatabase[]) {
                    if (item._id.toString() == payload.ItemId.$oid) {
                        item.Features ??= 0;
                        item.Features |= 2;
                        break;
                    }
                }
                break;
            default:
                throw new Error("Unsupported upgrade: " + operation.UpgradeRequirement);
        }
    }
    await inventory.save();
    res.end();
};
