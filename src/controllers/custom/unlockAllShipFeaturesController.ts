import type { RequestHandler } from "express";
import allShipFeatures from "../../../static/fixed_responses/allShipFeatures.json" with { type: "json" };
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getPersonalRooms } from "../../services/personalRoomsService.ts";

export const unlockAllShipFeaturesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const personalRooms = await getPersonalRooms(accountId);

    const featureSet = new Set(personalRooms.Ship.Features);
    for (const feature of allShipFeatures) {
        if (!featureSet.has(feature)) {
            personalRooms.Ship.Features.push(feature);
        }
    }

    await personalRooms.save();
    res.end();
};
