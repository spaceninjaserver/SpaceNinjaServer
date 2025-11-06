import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { addStartingGear, getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { TPartialStartingGear } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";

export const giveStartingGearPostController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const startingGear = getJSONfromString<TPartialStartingGear>(String(req.body));
    const inventory = await getInventory(accountId);

    const inventoryChanges = await addStartingGear(inventory, startingGear);
    await inventory.save();

    res.send(inventoryChanges);
};

export const giveStartingGearGetController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);

    const inventoryChanges = await addStartingGear(inventory, {
        Suits: [
            {
                ItemType: String(req.query.warframeName),
                ItemId: { $oid: "0" },
                Configs: []
            }
        ]
    });
    await inventory.save();

    res.send(inventoryChanges); // Not sure if this is even needed
};
