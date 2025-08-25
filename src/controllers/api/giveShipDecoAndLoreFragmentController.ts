import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { addLoreFragmentScans, addShipDecorations, getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { ITypeCount } from "../../types/commonTypes.ts";
import type { ILoreFragmentScan } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";

export const giveShipDecoAndLoreFragmentController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "LoreFragmentScans ShipDecorations");
    const data = getJSONfromString<IGiveShipDecoAndLoreFragmentRequest>(String(req.body));
    addLoreFragmentScans(inventory, data.LoreFragmentScans);
    addShipDecorations(inventory, data.ShipDecorations);
    await inventory.save();
    res.end();
};

interface IGiveShipDecoAndLoreFragmentRequest {
    LoreFragmentScans: ILoreFragmentScan[];
    ShipDecorations: ITypeCount[];
}
