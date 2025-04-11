import { RequestHandler } from "express";
import { ISaveLoadoutRequest } from "@/src/types/saveLoadoutTypes";
import { handleInventoryItemConfigChange } from "@/src/services/saveLoadoutService";
import { getAccountIdForRequest } from "@/src/services/loginService";

export const saveLoadoutController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);

    const body: ISaveLoadoutRequest = JSON.parse(req.body as string) as ISaveLoadoutRequest;
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
