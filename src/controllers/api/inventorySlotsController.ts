import { parseString } from "@/src/helpers/general";
import { getInventory } from "@/src/services/inventoryService";
import { RequestHandler } from "express";

export interface IInventoryChanges {
    InventoryChanges: { [key: string]: unknown };
}

export interface IInventorySlotsRequest {
    Bin: "PveBonusLoadoutBin";
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const inventorySlotsController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    //const body = req.body as IInventorySlotsRequest;

    //check which slot was purchased

    const inventory = await getInventory(accountId);

    //add slots
    res.json({ InventoryChanges: { PremiumCreditsFree: -20, PremiumCredits: -20 } } satisfies IInventoryChanges);
};
