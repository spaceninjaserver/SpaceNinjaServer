import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { addStartingGear, getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import type { TPartialStartingGear } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";

export const giveStartingGearPostController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const accountId = account._id.toString();
    const startingGear = getJSONfromString<TPartialStartingGear>(String(req.body));
    const inventory = await getInventory(accountId);

    const inventoryChanges = await addStartingGear(inventory, account.BuildLabel, startingGear);
    await inventory.save();

    res.send(inventoryChanges);
};

export const giveStartingGearGetController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const accountId = account._id.toString();
    const inventory = await getInventory(accountId);

    const inventoryChanges = await addStartingGear(inventory, account.BuildLabel, {
        Suits: [
            {
                ItemType: String(req.query.warframeName),
                ItemId: { $oid: "0" },
                Configs: []
            }
        ],
        LongGuns: [
            {
                ItemType: "/Lotus/Weapons/Tenno/Rifle/StartingRifle",
                ItemId: { $oid: "0" },
                Configs: []
            }
        ]
    });
    await inventory.save();

    res.send(inventoryChanges); // Not sure if this is even needed
};
