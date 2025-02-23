import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addMiscItems, getInventory, updateCurrency } from "@/src/services/inventoryService";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { IUnveiledRivenFingerprint, randomiseRivenStats } from "@/src/helpers/rivenFingerprintHelper";
import { getRandomElement, getRandomInt } from "@/src/services/rngService";
import { ExportUpgrades } from "warframe-public-export-plus";

export const completeRandomModChallengeController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const request = getJSONfromString<ICompleteRandomModChallengeRequest>(String(req.body));
    let inventoryChanges: IInventoryChanges = {};

    // Remove 20 plat or riven cipher
    if ((req.query.p as string) == "1") {
        inventoryChanges = { ...updateCurrency(inventory, 20, true) };
    } else {
        const miscItemChanges: IMiscItem[] = [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/RivenIdentifier",
                ItemCount: -1
            }
        ];
        addMiscItems(inventory, miscItemChanges);
        inventoryChanges.MiscItems = miscItemChanges;
    }

    // Update riven fingerprint to a randomised unveiled state
    const upgrade = inventory.Upgrades.id(request.ItemId)!;
    const meta = ExportUpgrades[upgrade.ItemType];
    const fingerprint: IUnveiledRivenFingerprint = {
        compat: getRandomElement(meta.compatibleItems!),
        lim: 0,
        lvl: 0,
        lvlReq: getRandomInt(8, 16),
        pol: getRandomElement(["AP_ATTACK", "AP_DEFENSE", "AP_TACTIC"]),
        buffs: [],
        curses: []
    };
    randomiseRivenStats(meta, fingerprint);
    upgrade.UpgradeFingerprint = JSON.stringify(fingerprint);

    await inventory.save();

    res.json({
        InventoryChanges: inventoryChanges,
        Fingerprint: upgrade.UpgradeFingerprint
    });
};

interface ICompleteRandomModChallengeRequest {
    ItemId: string;
}
