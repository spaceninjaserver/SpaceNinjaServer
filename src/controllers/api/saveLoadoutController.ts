import type { RequestHandler } from "express";
import type { ISaveLoadoutRequest } from "../../types/saveLoadoutTypes.ts";
import { handleInventoryItemConfigChange } from "../../services/saveLoadoutService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";

export const saveLoadoutController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);

    const body: ISaveLoadoutRequest = getJSONfromString<ISaveLoadoutRequest>(String(req.body));
    // console.log(util.inspect(body, { showHidden: false, depth: null, colors: true }));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { UpgradeVer, ...equipmentChanges } = body;
    const newLoadoutId = await handleInventoryItemConfigChange(equipmentChanges, accountId);

    //send back new loadout id, if new loadout was added
    if (newLoadoutId) {
        res.send(newLoadoutId);
    }
    res.end();
};
