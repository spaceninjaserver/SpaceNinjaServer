import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IHubNpcCustomization } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";

export const setHubNpcCustomizationsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "HubNpcCustomizations");
    const upload = getJSONfromString<IHubNpcCustomization>(String(req.body));
    inventory.HubNpcCustomizations ??= [];
    const cust = inventory.HubNpcCustomizations.find(x => x.Tag == upload.Tag);
    if (cust) {
        cust.Colors = upload.Colors;
        cust.Pattern = upload.Pattern;
    } else {
        inventory.HubNpcCustomizations.push(upload);
    }
    await inventory.save();
    res.end();
};
