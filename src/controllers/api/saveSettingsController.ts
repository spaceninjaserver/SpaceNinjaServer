import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { RequestHandler } from "express";
import { ISettings } from "@/src/types/inventoryTypes/inventoryTypes";

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
