import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getPersonalRooms } from "../../services/personalRoomsService.ts";
import { addString } from "../../helpers/stringHelpers.ts";

export const commitStoryModeDecisionController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const promises: Promise<void>[] = [];
    promises.push(
        (async (): Promise<void> => {
            const inventory = await getInventory(accountId, "MadeStoryModeDecision");
            inventory.MadeStoryModeDecision = true;
            await inventory.save();
        })()
    );
    if (req.query.skip == "1") {
        promises.push(
            (async (): Promise<void> => {
                const personalRooms = await getPersonalRooms(accountId, "Ship");
                for (const feature of [
                    "/Lotus/Types/Items/ShipFeatureItems/EarthNavigationFeatureItem",
                    "/Lotus/Types/Items/ShipFeatureItems/MercuryNavigationFeatureItem",
                    "/Lotus/Types/Items/ShipFeatureItems/ArsenalFeatureItem",
                    "/Lotus/Types/Items/ShipFeatureItems/SocialMenuFeatureItem",
                    "/Lotus/Types/Items/ShipFeatureItems/FoundryFeatureItem",
                    "/Lotus/Types/Items/ShipFeatureItems/ModsFeatureItem"
                ]) {
                    addString(personalRooms.Ship.Features, feature);
                }
                await personalRooms.save();
            })()
        );
    }
    await Promise.all(promises);
    res.end();
};
