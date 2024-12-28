import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { IStatsView } from "@/src/types/statTypes";
import { config } from "@/src/services/configService";
import allScans from "@/static/fixed_responses/allScans.json";
import { ExportEnemies } from "warframe-public-export-plus";

const viewController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await Inventory.findOne({ accountOwnerId: accountId });
    if (!inventory) {
        res.status(400).json({ error: "inventory was undefined" });
        return;
    }

    const responseJson: IStatsView = {};
    responseJson.Weapons = [];
    for (const item of inventory.XPInfo) {
        responseJson.Weapons.push({
            type: item.ItemType,
            xp: item.XP
        });
    }
    if (config.unlockAllScans) {
        responseJson.Scans = allScans;
        for (const type of Object.keys(ExportEnemies.avatars)) {
            if (!responseJson.Scans.find(x => x.type == type)) {
                responseJson.Scans.push({ type, scans: 9999 });
            }
        }
    }
    res.json(responseJson);
};

export { viewController };
