import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IIncentiveState } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";

export const startCollectibleEntryController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const request = getJSONfromString<IStartCollectibleEntryRequest>(String(req.body));
    inventory.CollectibleSeries ??= [];
    inventory.CollectibleSeries.push({
        CollectibleType: request.target,
        Count: 0,
        Tracking: "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        ReqScans: request.reqScans,
        IncentiveStates: request.other
    });
    await inventory.save();
    res.status(200).end();
};

interface IStartCollectibleEntryRequest {
    target: string;
    reqScans: number;
    other: IIncentiveState[];
}
