import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { addMiscItems, getInventory, updateCurrency } from "../../services/inventoryService.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import type { IMiscItem } from "../../types/inventoryTypes/inventoryTypes.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import type { IVeiledRivenFingerprint } from "../../helpers/rivenHelper.ts";

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
