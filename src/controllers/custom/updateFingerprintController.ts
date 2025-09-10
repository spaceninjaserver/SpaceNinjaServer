import { getInventory } from "../../services/inventoryService.ts";
import type { WeaponTypeInternal } from "../../services/itemDataService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import { sendWsBroadcastToGame } from "../../services/wsService.ts";

export const updateFingerprintController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = req.body as IUpdateFingerPrintRequest;
    const inventory = await getInventory(accountId, request.category);
    const item = inventory[request.category].id(request.oid);
    if (item) {
        if (request.action == "set" && request.upgradeFingerprint.buffs[0].Tag) {
            const newUpgradeFingerprint = request.upgradeFingerprint;
            if (!newUpgradeFingerprint.compact) newUpgradeFingerprint.compact = item.ItemType;

            item.UpgradeType = request.upgradeType;
            item.UpgradeFingerprint = JSON.stringify(newUpgradeFingerprint);
        } else if (request.action == "remove") {
            item.UpgradeFingerprint = undefined;
            item.UpgradeType = undefined;
        }
        await inventory.save();
    }
    res.end();
    sendWsBroadcastToGame(accountId, { sync_inventory: true });
};

interface IUpdateFingerPrintRequest {
    category: WeaponTypeInternal;
    oid: string;
    action: "set" | "remove";
    upgradeType: string;
    upgradeFingerprint: {
        compact?: string;
        buffs: {
            Tag: string;
            Value: number;
        }[];
    };
}
