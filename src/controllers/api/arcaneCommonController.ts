import type { RequestHandler } from "express";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { getInventory, addMods, addMiscItem } from "../../services/inventoryService.ts";
import type { IOid } from "../../types/commonTypes.ts";
import { logger } from "../../utils/logger.ts";
import { JSONParse } from "json-with-bigint";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";

export const arcaneCommonController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id.toString());
    const body = String(req.body);

    const parsed: unknown = JSONParse(body.substring(0, body.lastIndexOf("}") + 1));
    if (typeof parsed === "object" && parsed !== null && !("newRank" in parsed) && "skinId" in parsed) {
        const json = getJSONfromString<IArcaneLegacyRequest>(body);
        const item = inventory.WeaponSkins.id(json.skinId);
        const legacyArcaneLevelCounts = [1, 3, 6, 10];
        if (item) {
            if (json.operationType == "Install") {
                const resp: IArcaneLegacyInstallResp = { newLevel: 0 };
                let currentLevel = item.UpgradeFingerprint
                    ? (JSON.parse(item.UpgradeFingerprint) as { lvl: number }).lvl
                    : -1;

                // Return different arcane
                if (item.UpgradeType && item.UpgradeType != json.arcaneType && currentLevel >= 0) {
                    const numToRefund = legacyArcaneLevelCounts[currentLevel];
                    resp.numToRefund = numToRefund;
                    resp.typeToRefund = item.UpgradeType;
                    addMods(inventory, [{ ItemType: item.UpgradeType, ItemCount: numToRefund }]);

                    item.UpgradeFingerprint = undefined;
                    item.UpgradeType = undefined;
                    currentLevel = -1;
                }

                const newLevel = currentLevel + 1;
                resp.newLevel = newLevel;
                let numConsumed = legacyArcaneLevelCounts[newLevel];
                if (currentLevel >= 0) {
                    numConsumed -= legacyArcaneLevelCounts[currentLevel];
                }
                item.UpgradeFingerprint = JSON.stringify({ lvl: newLevel });
                item.UpgradeType = json.arcaneType!;
                addMods(inventory, [{ ItemType: json.arcaneType!, ItemCount: numConsumed * -1 }]);
                res.json(resp);
            } else if (json.operationType == "Distill") {
                const currentLevel = (JSON.parse(item.UpgradeFingerprint!) as { lvl: number }).lvl;
                const arcaneType = item.UpgradeType!;
                const numToRefund = legacyArcaneLevelCounts[currentLevel];
                item.UpgradeFingerprint = undefined;
                item.UpgradeType = undefined;
                addMods(inventory, [{ ItemType: arcaneType, ItemCount: numToRefund }]);
                if (account.BuildLabel && version_compare(account.BuildLabel, gameToBuildVersion["19.4.1"]) <= 0) {
                    addMiscItem(inventory, "/Lotus/Types/Recipes/CosmeticUnenhancerItem", -1);
                }
                res.json({ arcaneType, numToRefund });
            } else {
                logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
                throw new Error(`unknown legacy arcaneCommon operationType: ${json.operationType}`);
            }
        } else {
            logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
            throw new Error(`Failed to find item with OID ${json.skinId}`);
        }
        await inventory.save();
        return;
    }
    const json = getJSONfromString<IArcaneCommonRequest>(body);
    const upgrade = inventory.Upgrades.id(json.arcane.ItemId.$oid);
    if (json.newRank == -1) {
        // Break down request?
        if (!upgrade || !upgrade.UpgradeFingerprint) {
            throw new Error(`Failed to find upgrade with OID ${json.arcane.ItemId.$oid}`);
        }

        // Remove Upgrade
        inventory.Upgrades.pull({ _id: json.arcane.ItemId.$oid });

        // Add RawUpgrades
        const numRawUpgradesToGive = arcaneLevelCounts[(JSON.parse(upgrade.UpgradeFingerprint) as { lvl: number }).lvl];
        addMods(inventory, [
            {
                ItemType: json.arcane.ItemType,
                ItemCount: numRawUpgradesToGive
            }
        ]);

        res.json({ upgradeId: json.arcane.ItemId.$oid, numConsumed: numRawUpgradesToGive });
    } else {
        // Upgrade request?
        let numConsumed = arcaneLevelCounts[json.newRank];
        let upgradeId = json.arcane.ItemId.$oid;
        if (upgrade) {
            // Have an existing Upgrade item?
            if (upgrade.UpgradeFingerprint) {
                const existingLevel = (JSON.parse(upgrade.UpgradeFingerprint) as { lvl: number }).lvl;
                numConsumed -= arcaneLevelCounts[existingLevel];
            }
            upgrade.UpgradeFingerprint = JSON.stringify({ lvl: json.newRank });
        } else {
            const newLength = inventory.Upgrades.push({
                ItemType: json.arcane.ItemType,
                UpgradeFingerprint: JSON.stringify({ lvl: json.newRank })
            });
            upgradeId = inventory.Upgrades[newLength - 1]._id.toString();
        }

        // Remove RawUpgrades
        addMods(inventory, [
            {
                ItemType: json.arcane.ItemType,
                ItemCount: numConsumed * -1
            }
        ]);

        res.json({ newLevel: json.newRank, numConsumed, upgradeId });
    }
    await inventory.save();
};

const arcaneLevelCounts = [0, 3, 6, 10, 15, 21];

interface IArcaneCommonRequest {
    arcane: {
        ItemType: string;
        ItemId: IOid;
        FromSKU: boolean;
        UpgradeFingerprint: string;
        PendingRerollFingerprint: string;
        ItemCount: number;
        LastAdded: IOid;
    };
    newRank: number;
}

interface IArcaneLegacyRequest {
    arcaneType?: string;
    skinId: string;
    operationType: "Install" | "Distill" | "idk";
    modType: number; // 6
    giveItem?: boolean;
}

interface IArcaneLegacyInstallResp {
    newLevel: number;
    typeToRefund?: string;
    numToRefund?: number;
    AddedSkinId?: string;
}

// interface IArcaneLegacyDistillResp {
//     arcaneType: string;
//     numToRefund: number;
// }
