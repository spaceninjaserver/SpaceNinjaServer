import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addLoreFragmentScans, addShipDecorations, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { ITypeCount } from "@/src/types/commonTypes";
import { ILoreFragmentScan } from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";

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
