import { getInventory2 } from "../../services/inventoryService.ts";
import type { WeaponTypeInternal } from "../../services/itemDataService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import { sendWsBroadcastToGame } from "../../services/wsService.ts";
import type { TRarity } from "warframe-public-export-plus";

export const updateFingerprintController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = req.body as IUpdateFingerPrintRequest;
    const inventory = await getInventory2(accountId, request.category);
    if (request.category !== "Upgrades") {
        const item = inventory[request.category].id(request.oid);
        if (item) {
            const newUpgradeFingerprint = request.upgradeFingerprint;
            const isValence = "buffs" in newUpgradeFingerprint;
            if (request.action == "set" && (!isValence || newUpgradeFingerprint.buffs[0].Tag)) {
                if (isValence && !newUpgradeFingerprint.compact) newUpgradeFingerprint.compact = item.ItemType;
                item.UpgradeType = request.upgradeType;
                item.UpgradeFingerprint = JSON.stringify(newUpgradeFingerprint);
            } else if (request.action == "remove") {
                item.UpgradeFingerprint = undefined;
                item.UpgradeType = undefined;
            }
            await inventory.save();
        }
    } else {
        const item = inventory.Upgrades.id(request.oid);
        if (item) {
            const newUpgradeFingerprint = request.upgradeFingerprint;
            item.UpgradeFingerprint = JSON.stringify(newUpgradeFingerprint);
            await inventory.save();
        }
    }
    res.end();
    sendWsBroadcastToGame(accountId, { sync_inventory: true });
};

type IUpdateFingerPrintRequest = IEquipmentRequest | IUpgradeRequest;

interface IEquipmentRequest {
    category: WeaponTypeInternal | "WeaponSkins";
    oid: string;
    action: "set" | "remove";
    upgradeType: string;
    upgradeFingerprint:
        | {
              // Valence bonus
              compact?: string;
              buffs: {
                  Tag: string;
                  Value: number;
              }[];
          }
        | {
              // Pre-U22.14 arcane on a cosmetic
              lvl: number;
          };
}

interface IUpgradeRequest {
    category: "Upgrades";
    oid: string;
    action: "set";
    upgradeFingerprint: {
        reqLevel: number;
        fits: string;
        upgrades: {
            upgrade: string;
            valueRarity: TRarity;
            value: number;
        }[];
    };
}
