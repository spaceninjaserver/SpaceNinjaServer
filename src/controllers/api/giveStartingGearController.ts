import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";
import { getInventory } from "@/src/services/inventoryService";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const giveStartingGearController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);

    const inventory = await getInventory(accountId);
    inventory.ReceivedStartingGear = true;
    console.log(req.query);
    await inventory.save();
    res.status(200);
};