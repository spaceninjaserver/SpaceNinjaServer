import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import type { RequestHandler } from "express";
import { ExportArcanes, ExportUpgrades } from "warframe-public-export-plus";

export const addMissingMaxRankModsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "Upgrades");

    const maxOwnedRanks: Record<string, number> = {};
    for (const upgrade of inventory.Upgrades) {
        const fingerprint = JSON.parse(upgrade.UpgradeFingerprint ?? "{}") as { lvl?: number };
        if (fingerprint.lvl) {
            maxOwnedRanks[upgrade.ItemType] ??= 0;
            if (fingerprint.lvl > maxOwnedRanks[upgrade.ItemType]) {
                maxOwnedRanks[upgrade.ItemType] = fingerprint.lvl;
            }
        }
    }

    for (const [uniqueName, data] of Object.entries(ExportUpgrades)) {
        if (data.fusionLimit != 0 && data.type != "PARAZON" && maxOwnedRanks[uniqueName] != data.fusionLimit) {
            inventory.Upgrades.push({
                ItemType: uniqueName,
                UpgradeFingerprint: JSON.stringify({ lvl: data.fusionLimit })
            });
        }
    }

    for (const [uniqueName, data] of Object.entries(ExportArcanes)) {
        if (
            data.name != "/Lotus/Language/Items/GenericCosmeticEnhancerName" &&
            maxOwnedRanks[uniqueName] != data.fusionLimit
        ) {
            inventory.Upgrades.push({
                ItemType: uniqueName,
                UpgradeFingerprint: JSON.stringify({ lvl: data.fusionLimit })
            });
        }
    }

    await inventory.save();
    res.end();
};
