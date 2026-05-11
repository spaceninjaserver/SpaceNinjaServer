import type { RequestHandler } from "express";
import type { ISaveLoadoutRequest } from "../../types/saveLoadoutTypes.ts";
import { handleInventoryItemConfigChange } from "../../services/saveLoadoutService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";

export const saveLoadoutController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);

    const body: ISaveLoadoutRequest = getJSONfromString<ISaveLoadoutRequest>(String(req.body));
    //console.log(JSON.stringify(body, null, 2));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { UpgradeVer, ...equipmentChanges } = body;
    const newLoadoutId = await handleInventoryItemConfigChange(equipmentChanges, account._id, buildLabel);

    //send back new loadout id, if new loadout was added
    if (newLoadoutId) {
        res.send(newLoadoutId);
    }
    res.end();
};
