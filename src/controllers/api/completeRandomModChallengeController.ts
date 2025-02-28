import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addMiscItems, getInventory, updateCurrency } from "@/src/services/inventoryService";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { createUnveiledRivenFingerprint } from "@/src/helpers/rivenFingerprintHelper";
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
    upgrade.UpgradeFingerprint = JSON.stringify(createUnveiledRivenFingerprint(meta));

    await inventory.save();

    res.json({
        InventoryChanges: inventoryChanges,
        Fingerprint: upgrade.UpgradeFingerprint
    });
};

interface ICompleteRandomModChallengeRequest {
    ItemId: string;
}
