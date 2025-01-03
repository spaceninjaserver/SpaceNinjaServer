import { RequestHandler } from "express";
import { config } from "@/src/services/configService";
import allShipFeatures from "@/static/fixed_responses/allShipFeatures.json";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getPersonalRooms } from "@/src/services/personalRoomsService";
import { getShip } from "@/src/services/shipService";
import { Loadout } from "@/src/models/inventoryModels/loadoutModel";
import { toOid } from "@/src/helpers/inventoryHelpers";
import { IGetShipResponse } from "@/src/types/shipTypes";
import { IPersonalRooms } from "@/src/types/personalRoomsTypes";

export const getShipController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const personalRoomsDb = await getPersonalRooms(accountId);
    const personalRooms = personalRoomsDb.toJSON<IPersonalRooms>();
    const loadout = await getLoadout(accountId);
    const ship = await getShip(personalRoomsDb.activeShipId, "ShipAttachments SkinFlavourItem");

    const getShipResponse: IGetShipResponse = {
        ShipOwnerId: accountId,
        LoadOutInventory: { LoadOutPresets: loadout.toJSON() },
        Ship: {
            ...personalRooms.Ship,
            ShipId: toOid(personalRoomsDb.activeShipId),
            ShipInterior: {
                Colors: personalRooms.ShipInteriorColors,
                ShipAttachments: ship.ShipAttachments,
                SkinFlavourItem: ship.SkinFlavourItem
            }
        },
        Apartment: personalRooms.Apartment,
        TailorShop: personalRooms.TailorShop
    };

    if (config.unlockAllShipFeatures) {
        getShipResponse.Ship.Features = allShipFeatures;
    }

    res.json(getShipResponse);
};

export const getLoadout = async (accountId: string) => {
    const loadout = await Loadout.findOne({ loadoutOwnerId: accountId });

    if (!loadout) {
        throw new Error(`loadout not found for account ${accountId}`);
    }

    return loadout;
};
