import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { createGarden, getPersonalRooms } from "../../services/personalRoomsService.ts";
import type { IGetShipResponse, IPersonalRoomsClient } from "../../types/personalRoomsTypes.ts";
import { getLoadout } from "../../services/loadoutService.ts";
import { toOid } from "../../helpers/inventoryHelpers.ts";

export const getShipController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const personalRoomsDb = await getPersonalRooms(accountId);

    // Setup gardening if it's missing. Maybe should be done as part of some quest completion in the future.
    if (personalRoomsDb.Apartment.Gardening.Planters.length == 0) {
        personalRoomsDb.Apartment.Gardening = createGarden();
        await personalRoomsDb.save();
    }

    const personalRooms = personalRoomsDb.toJSON<IPersonalRoomsClient>();
    const loadout = await getLoadout(accountId);

    const getShipResponse: IGetShipResponse = {
        ShipOwnerId: accountId,
        LoadOutInventory: { LoadOutPresets: loadout.toJSON() },
        Ship: {
            ...personalRooms.Ship,
            ShipId: toOid(personalRoomsDb.activeShipId)
        },
        Apartment: personalRooms.Apartment,
        TailorShop: personalRooms.TailorShop
    };

    res.json(getShipResponse);
};
