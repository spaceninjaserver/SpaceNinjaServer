import type { RequestHandler } from "express";
import { getPersonalRooms, getShip } from "../../services/personalRoomsService.ts";
import type { IGetShipResponse } from "../../types/personalRoomsTypes.ts";

export const getShipController: RequestHandler = async (req, res) => {
    const personalRoomsDb = await getPersonalRooms(req.query.shipOwnerId as string);

    if (personalRoomsDb.Ship.ContentUrlSignature != (req.query.sig as string)) {
        res.status(409).send("Paramater error"); // [sic]
        return;
    }

    const getShipResponse: IGetShipResponse = await getShip(personalRoomsDb);
    res.json(getShipResponse);
};
