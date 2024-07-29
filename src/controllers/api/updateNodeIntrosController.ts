import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { IUpdateNodeIntro } from "@/src/types/requestTypes";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const updateNodeIntrosController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString(String(req.body)) as IUpdateNodeIntro;

    // Update inventory
    const inventory = await Inventory.findOne({ accountOwnerId: accountId });
    if (inventory) {
        inventory.NodeIntrosCompleted.push(payload.NodeIntrosCompleted);
        await inventory.save();
    }

    res.status(200).end();
};

export { updateNodeIntrosController };
