import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addMiscItems, getInventory, updateCurrency } from "@/src/services/inventoryService";
import type { IInventoryChanges } from "@/src/types/purchaseTypes";
import type { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import type { IVeiledRivenFingerprint } from "@/src/helpers/rivenHelper";

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

    // Complete the riven challenge
    const upgrade = inventory.Upgrades.id(request.ItemId)!;
    const fp = JSON.parse(upgrade.UpgradeFingerprint!) as IVeiledRivenFingerprint;
    fp.challenge.Progress = fp.challenge.Required;
    upgrade.UpgradeFingerprint = JSON.stringify(fp);

    await inventory.save();

    res.json({
        InventoryChanges: inventoryChanges,
        Fingerprint: upgrade.UpgradeFingerprint
    });
};

interface ICompleteRandomModChallengeRequest {
    ItemId: string;
}
