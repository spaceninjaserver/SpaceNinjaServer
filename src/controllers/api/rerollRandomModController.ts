import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addMiscItems, getInventory } from "@/src/services/inventoryService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { createUnveiledRivenFingerprint, randomiseRivenStats, RivenFingerprint } from "@/src/helpers/rivenHelper";
import { ExportUpgrades } from "warframe-public-export-plus";
import { IOid } from "@/src/types/commonTypes";

export const rerollRandomModController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = getJSONfromString<RerollRandomModRequest>(String(req.body));
    if ("ItemIds" in request) {
        const inventory = await getInventory(accountId, "Upgrades MiscItems");
        const changes: IChange[] = [];
        let totalKuvaCost = 0;
        request.ItemIds.forEach(itemId => {
            const upgrade = inventory.Upgrades.id(itemId)!;
            const fingerprint = JSON.parse(upgrade.UpgradeFingerprint!) as RivenFingerprint;
            if ("challenge" in fingerprint) {
                upgrade.UpgradeFingerprint = JSON.stringify(
                    createUnveiledRivenFingerprint(ExportUpgrades[upgrade.ItemType])
                );
            } else {
                fingerprint.rerolls ??= 0;
                const kuvaCost = fingerprint.rerolls < rerollCosts.length ? rerollCosts[fingerprint.rerolls] : 3500;
                totalKuvaCost += kuvaCost;
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
            }

            changes.push({
                ItemId: { $oid: request.ItemIds[0] },
                UpgradeFingerprint: upgrade.UpgradeFingerprint,
                PendingRerollFingerprint: upgrade.PendingRerollFingerprint
            });
        });

        await inventory.save();

        res.json({
            changes: changes,
            cost: totalKuvaCost
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

interface IChange {
    ItemId: IOid;
    UpgradeFingerprint?: string;
    PendingRerollFingerprint?: string;
}

const rerollCosts = [900, 1000, 1200, 1400, 1700, 2000, 2350, 2750, 3150];
