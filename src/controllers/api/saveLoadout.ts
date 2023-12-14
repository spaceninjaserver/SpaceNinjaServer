import { RequestHandler } from "express";
import util from "util";
import { ISaveLoadoutRequest } from "@/src/types/saveLoadoutTypes";
import { handleInventoryItemConfigChange } from "@/src/services/saveLoadoutService";
import { parseString } from "@/src/helpers/general";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const saveLoadoutController: RequestHandler = async (req, res) => {
    //validate here
    const accountId = parseString(req.query.accountId);

    try {
        const body: ISaveLoadoutRequest = JSON.parse(req.body as string) as ISaveLoadoutRequest;
        // console.log(util.inspect(body, { showHidden: false, depth: null, colors: true }));

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { UpgradeVer, ...equipmentChanges } = body;
        await handleInventoryItemConfigChange(equipmentChanges, accountId);
    } catch (error) {
        res.status(200).end();
    }
};

export { saveLoadoutController };
