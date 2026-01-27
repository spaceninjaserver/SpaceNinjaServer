import type { RequestHandler } from "express";
import { getInventory } from "../../services/inventoryService.ts";
import { getStats } from "../../services/statsService.ts";
import type { IStatsClient } from "../../types/statTypes.ts";
import { getProfileViewingDataByGuildId } from "../dynamic/getProfileViewingDataController.ts";

const viewController: RequestHandler = async (req, res) => {
    const lookupId = String(req.query.id ?? req.query.lookupId);

    if (req.query.guild == "1") {
        const data = await getProfileViewingDataByGuildId(lookupId);
        if (data) {
            res.json(data.Stats);
        } else {
            res.status(409).send("Could not find guild");
        }
        return;
    }

    const inventory = await getInventory(lookupId, "XPInfo");
    const playerStats = await getStats(lookupId);

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
