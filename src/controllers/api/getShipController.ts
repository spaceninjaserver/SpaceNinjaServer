import { RequestHandler } from "express";
import { config } from "@/src/services/configService";
import allShipFeatures from "@/static/fixed_responses/allShipFeatures.json";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { createGarden, getPersonalRooms } from "@/src/services/personalRoomsService";
import { toOid } from "@/src/helpers/inventoryHelpers";
import { IGetShipResponse } from "@/src/types/shipTypes";
import { IPersonalRoomsClient } from "@/src/types/personalRoomsTypes";
import { getLoadout } from "@/src/services/loadoutService";

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
            ShipId: toOid(personalRoomsDb.activeShipId),
            ShipInterior: {
                Colors: personalRooms.ShipInteriorColors,
                ShipAttachments: { HOOD_ORNAMENT: "" },
                SkinFlavourItem: ""
            },
            FavouriteLoadoutId: personalRooms.Ship.FavouriteLoadoutId
                ? toOid(personalRooms.Ship.FavouriteLoadoutId)
                : undefined
        },
        Apartment: personalRooms.Apartment,
        TailorShop: personalRooms.TailorShop
    };

    if (config.unlockAllShipFeatures) {
        getShipResponse.Ship.Features = allShipFeatures;
    }

    res.json(getShipResponse);
};
