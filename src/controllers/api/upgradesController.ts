import { RequestHandler } from "express";
import { IUpgradesRequest } from "@/src/types/requestTypes";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
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
        if (operation.UpgradeRequirement == "/Lotus/Types/Items/MiscItems/OrokinReactor") {
            for (const suit of inventory.Suits) {
                if (suit._id.toString() == payload.ItemId.$oid) {
                    suit.Features ??= 0;
                    suit.Features |= 1;
                    break;
                }
            }
        }
    }
    await inventory.save();
    res.end();
};
