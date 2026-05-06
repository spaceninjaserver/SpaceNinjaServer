import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { addMiscItems, getInventory2, updatePlatinum } from "../../services/inventoryService.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import type { IMiscItem } from "../../types/inventoryTypes/inventoryTypes.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import type { IVeiledRivenFingerprint } from "../../helpers/rivenHelper.ts";

export const completeRandomModChallengeController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory2(
        accountId,
        "infinitePlatinum",
        "PremiumCreditsFree",
        "PremiumCredits",
        "MiscItems",
        "Upgrades"
    );
    const request = getJSONfromString<ICompleteRandomModChallengeRequest>(String(req.body));
    let inventoryChanges: IInventoryChanges = {};

    // Remove 20 plat or riven cipher
    if ((req.query.p as string) == "1") {
        inventoryChanges = { ...updatePlatinum(inventory, 20) };
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
