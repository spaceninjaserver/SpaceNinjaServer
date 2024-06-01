import { RequestHandler } from "express";
import { config } from "@/src/services/configService";
import allShipFeatures from "@/static/fixed_responses/allShipFeatures.json";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getPersonalRooms } from "@/src/services/personalRoomsService";
import { getShip } from "@/src/services/shipService";
import { Loadout } from "@/src/models/inventoryModels/loadoutModel";
import { logger } from "@/src/utils/logger";
import { toOid } from "@/src/helpers/inventoryHelpers";
import { IGetShipResponse } from "@/src/types/shipTypes";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const getShipController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const personalRooms = await getPersonalRooms(accountId);
    const loadout = await getLoadout(accountId);
    const ship = await getShip(personalRooms.activeShipId, "ShipInteriorColors ShipAttachments SkinFlavourItem");

    const getShipResponse: IGetShipResponse = {
        ShipOwnerId: accountId,
        LoadOutInventory: { LoadOutPresets: loadout.toJSON() },
        Ship: {
            ...personalRooms.toJSON().Ship,
            ShipId: toOid(personalRooms.activeShipId),
            ShipInterior: {
                Colors: ship.ShipInteriorColors,
                ShipAttachments: ship.ShipAttachments,
                SkinFlavourItem: ship.SkinFlavourItem
            }
        },
        Apartment: personalRooms.Apartment
    };

    if (config.unlockallShipFeatures) {
        getShipResponse.Ship.Features = allShipFeatures;
    }

    res.json(getShipResponse);
};

export const getLoadout = async (accountId: string) => {
    const loadout = await Loadout.findOne({ loadoutOwnerId: accountId });

    if (!loadout) {
        logger.error(`loadout not found for account ${accountId}`);
        throw new Error("loadout not found");
    }

    return loadout;
};
