import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addStartingGear, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { TPartialStartingGear } from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";

export const giveStartingGearController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const startingGear = getJSONfromString<TPartialStartingGear>(String(req.body));
    const inventory = await getInventory(accountId);

    const inventoryChanges = await addStartingGear(inventory, startingGear);
    await inventory.save();

    res.send(inventoryChanges);
};
