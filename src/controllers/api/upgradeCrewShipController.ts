import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import type { RequestHandler } from "express";
import { addCrewShipFusionPoints, getInventory2 } from "../../services/inventoryService.ts";
import type { IOid } from "../../types/commonTypes.ts";
import { logger } from "../../utils/logger.ts";

export const upgradeCrewShipController: RequestHandler = async (request, response) => {
    const accountId = await getAccountIdForRequest(request);
    const data = getJSONfromString<IUpgradeCrewShipRequest>(String(request.body));
    const inventory = await getInventory2(accountId, "CrewShips", "CrewShipFusionPoints");
    const crewShip = inventory.CrewShips.find(ship => ship._id.equals(data.ShipId.$oid));
    if (crewShip) {
        crewShip.SlotLevels ??= [];
        crewShip.SlotLevels[data.Slot] = data.Level;
        addCrewShipFusionPoints(inventory, -data.FusionPointCost);
        await inventory.save();
        response.json({});
    } else {
        logger.error(`could not find crew ship with id ${data.ShipId.$oid} for upgrade`);
        response.status(400).end();
    }
};

interface IUpgradeCrewShipRequest {
    FusionPointCost: number;
    ShipId: IOid;
    Slot: number;
    Level: number;
}
