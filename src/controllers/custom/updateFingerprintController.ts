import { getInventory } from "@/src/services/inventoryService";
import { WeaponTypeInternal } from "@/src/services/itemDataService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

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
