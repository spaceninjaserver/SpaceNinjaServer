import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import {
    createGarden,
    getPersonalRooms,
    getShip,
    refreshContentUrlSignature
} from "../../services/personalRoomsService.ts";
import type { IGetShipResponse } from "../../types/personalRoomsTypes.ts";

export const getShipController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const personalRoomsDb = await getPersonalRooms(accountId);

    // Setup gardening if it's missing. Maybe should be done as part of some quest completion in the future.
    if (personalRoomsDb.Apartment.Gardening.Planters.length == 0) {
        personalRoomsDb.Apartment.Gardening = createGarden();
    }

    refreshContentUrlSignature(personalRoomsDb);
    await personalRoomsDb.save();

    const getShipResponse: IGetShipResponse = await getShip(personalRoomsDb);
    res.json(getShipResponse);
};
