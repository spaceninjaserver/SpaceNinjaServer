import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addMiscItems, getInventory } from "@/src/services/inventoryService";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { IOid } from "@/src/types/commonTypes";
import { ExportSyndicates } from "warframe-public-export-plus";

export const syndicateStandingBonusController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = JSON.parse(String(req.body)) as ISyndicateStandingBonusRequest;

    let gainedStanding = 0;
    request.Operation.Items.forEach(item => {
        const medallion = (ExportSyndicates[request.Operation.AffiliationTag].medallions ?? []).find(
            medallion => medallion.itemType == item.ItemType
        );
        if (medallion) {
            gainedStanding += medallion.standing * item.ItemCount;
        }

        item.ItemCount *= -1;
    });

    const inventory = await getInventory(accountId);
    addMiscItems(inventory, request.Operation.Items);

    const syndicate = inventory.Affiliations.find(x => x.Tag == request.Operation.AffiliationTag);
    if (syndicate !== undefined) {
        syndicate.Standing += gainedStanding;
    } else {
        inventory.Affiliations.push({
            Tag: request.Operation.AffiliationTag,
            Standing: gainedStanding
        });
    }

    // TODO: Subtract from daily limit bin; maybe also a cheat to skip that.

    await inventory.save();

    res.json({
        InventoryChanges: {
            MiscItems: request.Operation.Items
        },
        AffiliationMods: [
            {
                Tag: request.Operation.AffiliationTag,
                Standing: gainedStanding
            }
        ]
    });
};

interface ISyndicateStandingBonusRequest {
    Operation: {
        AffiliationTag: string;
        AlternateBonusReward: ""; // ???
        Items: IMiscItem[];
    };
    ModularWeaponId: IOid; // Seems to just be "000000000000000000000000", also note there's a "Category" query field
}
