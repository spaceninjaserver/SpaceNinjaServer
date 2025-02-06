import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { config } from "@/src/services/configService";
import allScans from "@/static/fixed_responses/allScans.json";
import { ExportEnemies } from "warframe-public-export-plus";
import { getInventory } from "@/src/services/inventoryService";
import { getStats } from "@/src/services/statsService";
import { IStatsView } from "@/src/types/statTypes";

const viewController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "XPInfo");
    const playerStats = await getStats(accountId);

    const responseJson: IStatsView = playerStats.toJSON();
    responseJson.Weapons ??= [];
    for (const item of inventory.XPInfo) {
        const weaponIndex = responseJson.Weapons.findIndex(element => element.type == item.ItemType);
        if (weaponIndex !== -1) {
            responseJson.Weapons[weaponIndex].xp == item.XP;
        } else {
            responseJson.Weapons.push({ type: item.ItemType, xp: item.XP });
        }
    }
    if (config.unlockAllScans) {
        const scans = new Set(allScans);
        for (const type of Object.keys(ExportEnemies.avatars)) {
            if (!scans.has(type)) scans.add(type);
        }
        responseJson.Scans ??= [];
        for (const type of scans) {
            responseJson.Scans.push({ type: type, scans: 9999 });
        }
    }
    res.json(responseJson);
};

export { viewController };
