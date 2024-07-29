import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { IStatsView } from "@/src/types/statTypes";
import { config } from "@/src/services/configService";
import allScans from "@/static/fixed_responses/allScans.json";
import Stat from "@/src/models/statsModel";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const viewController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await Inventory.findOne({ accountOwnerId: accountId });
    let playerStats = await Stat.findOne({ accountOwnerId: accountId });

    if (!inventory) {
        res.status(400).json({ error: "inventory was undefined" });
        return;
    }

    if (!playerStats) {
        playerStats = new Stat({ accountOwnerId: accountId });
        await playerStats.save();
    }

    const responseJson: IStatsView = playerStats;
    responseJson.Weapons ??= [];
    for (const item of inventory.XPInfo) {
        const weaponIndex = responseJson.Weapons.findIndex(element => element.type == item.ItemType);
        if (weaponIndex !== -1) {
            responseJson.Weapons[weaponIndex].xp == item.XP;
        } else {
            responseJson.Weapons.push({
                type: item.ItemType,
                xp: item.XP
            });
        }
    }
    if (config.unlockAllScans) {
        responseJson.Scans = allScans;
    }
    res.json(responseJson);
};

export { viewController };
