import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import type { IMiscAccountData } from "../../types/inventoryTypes/inventoryTypes.ts";

export const saveMiscDataController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString<IMiscAccountData>(String(req.body));
    const inventory = await getInventory(accountId, "MiscAccountData");
    inventory.MiscAccountData ??= [];
    const index = inventory.MiscAccountData.findIndex(d => d.PropertyName == payload.PropertyName);
    if (index !== -1) {
        inventory.MiscAccountData[index].Json = payload.Json;
    } else {
        inventory.MiscAccountData.push(payload);
    }
    await inventory.save();
    res.json({});
};
