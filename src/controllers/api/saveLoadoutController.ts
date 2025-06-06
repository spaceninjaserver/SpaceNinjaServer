import { RequestHandler } from "express";
import { ISaveLoadoutRequest } from "@/src/types/saveLoadoutTypes";
import { handleInventoryItemConfigChange } from "@/src/services/saveLoadoutService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";

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
