import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { unlockShipFeature } from "../../services/personalRoomsService.ts";

export const unlockShipFeatureController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "MiscItems accountOwnerId");
    const request = getJSONfromString<IUnlockShipFeatureRequest>(String(req.body));

    await unlockShipFeature(inventory, request.Feature);
    await inventory.save();
    res.send([]);
};
interface IUnlockShipFeatureRequest {
    Feature: string;
    KeyChain: string;
    ChainStage: number;
}
