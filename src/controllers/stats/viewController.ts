import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getStats } from "../../services/statsService.ts";
import type { IStatsClient } from "../../types/statTypes.ts";

const viewController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "XPInfo");
    const playerStats = await getStats(accountId);

    const responseJson = playerStats.toJSON<IStatsClient>();
    responseJson.Weapons ??= [];
    for (const item of inventory.XPInfo) {
        const weaponIndex = responseJson.Weapons.findIndex(element => element.type == item.ItemType);
        if (weaponIndex !== -1) {
            responseJson.Weapons[weaponIndex].xp = item.XP;
        } else {
            responseJson.Weapons.push({ type: item.ItemType, xp: item.XP });
        }
    }
    res.json(responseJson);
};

export { viewController };
