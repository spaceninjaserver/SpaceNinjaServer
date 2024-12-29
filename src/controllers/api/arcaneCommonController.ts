import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory, addMods } from "@/src/services/inventoryService";
import { IOid } from "@/src/types/commonTypes";

export const arcaneCommonController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const json = getJSONfromString(String(req.body)) as IArcaneCommonRequest;
    const inventory = await getInventory(accountId);
    const upgrade = inventory.Upgrades.find(x => x._id!.toString() == json.arcane.ItemId.$oid);
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
            upgradeId = inventory.Upgrades[newLength - 1]._id!.toString();
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
