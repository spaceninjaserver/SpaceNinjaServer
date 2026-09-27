import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IVesselCustomization } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";

export const setVesselCustomizationController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "VesselCustomization");
    const { Customization, IsMale } = getJSONfromString<IVesselCustomization>(String(req.body));
    inventory.VesselCustomization = { Customization, IsMale };
    await inventory.save();
    res.end();
};
