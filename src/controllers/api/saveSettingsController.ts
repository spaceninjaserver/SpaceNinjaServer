import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import type { ISettings } from "../../types/inventoryTypes/inventoryTypes.ts";

interface ISaveSettingsRequest {
    Settings: ISettings;
}

const saveSettingsController: RequestHandler = async (req, res): Promise<void> => {
    const accountId = await getAccountIdForRequest(req);

    const settingResults = getJSONfromString<ISaveSettingsRequest>(String(req.body));

    const inventory = await getInventory(accountId, "Settings");
    inventory.Settings = Object.assign(inventory.Settings ?? {}, settingResults.Settings);
    await inventory.save();
    res.json({ Settings: inventory.Settings });
};

export { saveSettingsController };
