import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addMiscItems, getInventory } from "@/src/services/inventoryService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { IUnveiledRivenFingerprint, randomiseRivenStats } from "@/src/helpers/rivenFingerprintHelper";
import { ExportUpgrades } from "warframe-public-export-plus";

export const rerollRandomModController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = getJSONfromString<RerollRandomModRequest>(String(req.body));
    if ("ItemIds" in request) {
        const inventory = await getInventory(accountId, "Upgrades MiscItems");
        const upgrade = inventory.Upgrades.id(request.ItemIds[0])!;
        const fingerprint = JSON.parse(upgrade.UpgradeFingerprint!) as IUnveiledRivenFingerprint;

        fingerprint.rerolls ??= 0;
        const kuvaCost = fingerprint.rerolls < rerollCosts.length ? rerollCosts[fingerprint.rerolls] : 3500;
        addMiscItems(inventory, [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Kuva",
                ItemCount: kuvaCost * -1
            }
        ]);

        fingerprint.rerolls++;
        upgrade.UpgradeFingerprint = JSON.stringify(fingerprint);

        randomiseRivenStats(ExportUpgrades[upgrade.ItemType], fingerprint);
        upgrade.PendingRerollFingerprint = JSON.stringify(fingerprint);

        await inventory.save();

        res.json({
            changes: [
                {
                    ItemId: { $oid: request.ItemIds[0] },
                    UpgradeFingerprint: upgrade.UpgradeFingerprint,
                    PendingRerollFingerprint: upgrade.PendingRerollFingerprint
                }
            ],
            cost: kuvaCost
        });
    } else {
        const inventory = await getInventory(accountId, "Upgrades");
        const upgrade = inventory.Upgrades.id(request.ItemId)!;
        if (request.CommitReroll && upgrade.PendingRerollFingerprint) {
            upgrade.UpgradeFingerprint = upgrade.PendingRerollFingerprint;
        }
        upgrade.PendingRerollFingerprint = undefined;
        await inventory.save();
        res.send(upgrade.UpgradeFingerprint);
    }
};

type RerollRandomModRequest = LetsGoGamblingRequest | AwDangitRequest;

interface LetsGoGamblingRequest {
    ItemIds: string[];
}

interface AwDangitRequest {
    ItemId: string;
    CommitReroll: boolean;
}

const rerollCosts = [900, 1000, 1200, 1400, 1700, 2000, 2350, 2750, 3150];
