import { getPersonalRooms } from "../../services/personalRoomsService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import { Types } from "mongoose";

export const setActiveShipController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const personalRooms = await getPersonalRooms(accountId);
    personalRooms.activeShipId = new Types.ObjectId(req.query.shipId as string);
    await personalRooms.save();
    res.status(200).end();
};
