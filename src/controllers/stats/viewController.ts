import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IStatsView } from "@/src/types/statTypes";
import { config } from "@/src/services/configService";
import allScans from "@/static/fixed_responses/allScans.json";
import { ExportEnemies } from "warframe-public-export-plus";
import { getInventory } from "@/src/services/inventoryService";

const viewController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "XPInfo");

    const responseJson: IStatsView = {};
    responseJson.Weapons = [];
    for (const item of inventory.XPInfo) {
        responseJson.Weapons.push({
            type: item.ItemType,
            xp: item.XP
        });
    }
    if (config.unlockAllScans) {
        const scans = new Set(allScans);
        for (const type of Object.keys(ExportEnemies.avatars)) {
            if (!scans.has(type)) {
                scans.add(type);
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
