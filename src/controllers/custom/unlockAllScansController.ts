import type { RequestHandler } from "express";
import allScans from "../../../static/fixed_responses/allScans.json" with { type: "json" };
import { ExportEnemies } from "warframe-public-export-plus";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getStats } from "../../services/statsService.ts";
import { getInventory } from "../../services/inventoryService.ts";

export const unlockAllScansController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const [stats, inventory] = await Promise.all([getStats(accountId), getInventory(accountId, "ChallengeProgress")]);

    const scanTypes = new Set<string>(allScans);
    for (const type of Object.keys(ExportEnemies.avatars)) {
        scanTypes.add(type);
    }

    stats.Scans = [];
    for (const type of scanTypes) {
        stats.Scans.push({ type, scans: 9999 });
    }

    const jsCodex = inventory.ChallengeProgress.find(x => x.Name === "JSCodexScan");

    if (jsCodex) {
        jsCodex.Progress = 1;
    } else {
        inventory.ChallengeProgress.push({
            Name: "JSCodexScan",
            Progress: 1
        });
    }

    await Promise.all([stats.save(), inventory.save()]);
    res.end();
};
