import type { RequestHandler } from "express";
import allShipFeatures from "../../../static/fixed_responses/allShipFeatures.json" with { type: "json" };
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { PersonalRooms } from "../../models/personalRoomsModel.ts";

export const unlockAllShipFeaturesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const { modifiedCount } = await PersonalRooms.updateOne(
        { personalRoomsOwnerId: accountId },
        { $addToSet: { "Ship.Features": { $each: allShipFeatures } } }
    );
    res.json({ count: modifiedCount });
};
