import type { RequestHandler } from "express";
import allScans from "../../../static/fixed_responses/allScans.json" with { type: "json" };
import { ExportEnemies } from "warframe-public-export-plus";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getStats } from "../../services/statsService.ts";

export const unlockAllScansController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const stats = await getStats(accountId);

    const scanTypes = new Set<string>(allScans);
    for (const type of Object.keys(ExportEnemies.avatars)) {
        scanTypes.add(type);
    }

    stats.Scans = [];
    for (const type of scanTypes) {
        stats.Scans.push({ type, scans: 9999 });
    }

    await stats.save();
    res.end();
};
