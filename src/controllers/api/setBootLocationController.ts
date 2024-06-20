import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getPersonalRooms } from "@/src/services/personalRoomsService";
import { TBootLocation } from "@/src/types/shipTypes";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const setBootLocationController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const personalRooms = await getPersonalRooms(accountId);
    personalRooms.Ship.BootLocation = req.query.bootLocation as string as TBootLocation;
    await personalRooms.save();
    res.end();
};
