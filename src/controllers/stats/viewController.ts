import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { config } from "../../services/configService.ts";
import allScans from "../../../static/fixed_responses/allScans.json" with { type: "json" };
import { ExportEnemies } from "warframe-public-export-plus";
import { getInventory } from "../../services/inventoryService.ts";
import { getStats } from "../../services/statsService.ts";
import type { IStatsClient } from "../../types/statTypes.ts";

const viewController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "XPInfo");
    const playerStats = await getStats(accountId);

    const responseJson = playerStats.toJSON() as IStatsClient;
    responseJson.Weapons ??= [];
    for (const item of inventory.XPInfo) {
        const weaponIndex = responseJson.Weapons.findIndex(element => element.type == item.ItemType);
        if (weaponIndex !== -1) {
            responseJson.Weapons[weaponIndex].xp = item.XP;
        } else {
            responseJson.Weapons.push({ type: item.ItemType, xp: item.XP });
        }
    }
    if (config.unlockAllScans) {
        const scans = new Set(allScans);
        for (const type of Object.keys(ExportEnemies.avatars)) {
            if (!scans.has(type)) scans.add(type);
        }

        // Take any existing scans and also set them to 9999
        if (responseJson.Scans) {
            for (const scan of responseJson.Scans) {
                scans.add(scan.type);
            }
        }
        responseJson.Scans = [];

        for (const type of scans) {
            responseJson.Scans.push({ type: type, scans: 9999 });
        }
    }
    res.json(responseJson);
};

export { viewController };
