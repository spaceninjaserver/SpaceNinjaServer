import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";

const DEFAULT_UPGRADE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const editSuitInvigorationUpgradeController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const { oid, data } = req.body as {
        oid: string;
        data?: {
            DefensiveUpgrade: string;
            OffensiveUpgrade: string;
            UpgradesExpiry?: number;
        };
    };
    const inventory = await getInventory(accountId);
    const suit = inventory.Suits.id(oid)!;
    if (data) {
        suit.DefensiveUpgrade = data.DefensiveUpgrade;
        suit.OffensiveUpgrade = data.OffensiveUpgrade;
        if (data.UpgradesExpiry) {
            suit.UpgradesExpiry = new Date(data.UpgradesExpiry);
        } else {
            suit.UpgradesExpiry = new Date(Date.now() + DEFAULT_UPGRADE_EXPIRY_MS);
        }
    } else {
        suit.DefensiveUpgrade = undefined;
        suit.OffensiveUpgrade = undefined;
        suit.UpgradesExpiry = undefined;
    }
    await inventory.save();
    res.end();
};
