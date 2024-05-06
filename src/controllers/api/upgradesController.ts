import { RequestHandler } from "express";
import { IUpgradesRequest } from "@/src/types/requestTypes";
import { IPolarity } from "@/src/types/inventoryTypes/commonInventoryTypes";
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
            case "/Lotus/Types/Items/MiscItems/WeaponPrimaryArcaneUnlocker":
            case "/Lotus/Types/Items/MiscItems/WeaponSecondaryArcaneUnlocker":
            case "/Lotus/Types/Items/MiscItems/WeaponMeleeArcaneUnlocker":
                for (const item of inventory[payload.ItemCategory as TGenericItemKey] as IGenericItemDatabase[]) {
                    if (item._id.toString() == payload.ItemId.$oid) {
                        item.Features ??= 0;
                        item.Features |= 32;
                    }
                }
                break;
            case "/Lotus/Types/Items/MiscItems/Forma":
                for (const item of inventory[payload.ItemCategory as TGenericItemKey] as IGenericItemDatabase[]) {
                    if (item._id.toString() == payload.ItemId.$oid) {
                        item.XP = 0;
                        item.Polarity ??= [];
                        item.Polarity.push({
                            Slot: operation.PolarizeSlot,
                            Value: operation.PolarizeValue
                        } satisfies IPolarity);
                        item.Polarized ??= 0;
                        item.Polarized += 1;
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
