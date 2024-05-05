import { getPersonalRooms } from "@/src/controllers/api/getShipController";
import { parseString } from "@/src/helpers/general";
import { RequestHandler } from "express";
import { Types } from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const setActiveShipController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    const shipId = parseString(req.query.shipId);

    const personalRooms = await getPersonalRooms(accountId);
    personalRooms.activeShipId = new Types.ObjectId(shipId);
    await personalRooms.save();
    res.status(200).end();
};
