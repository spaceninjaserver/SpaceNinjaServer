import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { addStartingGear, getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import type { TPartialStartingGear } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";

export const giveStartingGearPostController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const startingGear = getJSONfromString<TPartialStartingGear>(String(req.body));
    const inventory = await getInventory(account._id, undefined);

    const inventoryChanges = await addStartingGear(inventory, buildLabel, startingGear);
    await inventory.save();

    res.send(inventoryChanges);
};

export const giveStartingGearGetController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const inventory = await getInventory(account._id, undefined);

    const inventoryChanges = await addStartingGear(inventory, buildLabel, {
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
