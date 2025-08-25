import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import type { IIncentiveState } from "@/src/types/inventoryTypes/inventoryTypes";
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
