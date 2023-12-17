import { RequestHandler } from "express";
import util from "util";
import { ISaveLoadoutRequest } from "@/src/types/saveLoadoutTypes";
import { handleInventoryItemConfigChange } from "@/src/services/saveLoadoutService";
import { parseString } from "@/src/helpers/general";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const saveLoadoutController: RequestHandler = async (req, res) => {
    //validate here
    const accountId = parseString(req.query.accountId);

    try {
        const body: ISaveLoadoutRequest = JSON.parse(req.body as string) as ISaveLoadoutRequest;
        // console.log(util.inspect(body, { showHidden: false, depth: null, colors: true }));

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { UpgradeVer, ...equipmentChanges } = body;
        const newLoadoutId = await handleInventoryItemConfigChange(equipmentChanges, accountId);

        //send back new loadout id, if new loadout was added
        if (newLoadoutId) {
            res.send(newLoadoutId);
        }
        res.status(200).end();
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.log("error in saveLoadoutController", error.message);
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: "unknown error" });
        }
    }
};
