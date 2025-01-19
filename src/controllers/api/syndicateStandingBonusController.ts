import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addMiscItems, getInventory, getStandingLimit, updateStandingLimit } from "@/src/services/inventoryService";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { IOid } from "@/src/types/commonTypes";
import { ExportSyndicates } from "warframe-public-export-plus";
import { getMaxStanding } from "@/src/helpers/syndicateStandingHelper";

export const syndicateStandingBonusController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = JSON.parse(String(req.body)) as ISyndicateStandingBonusRequest;

    const syndicateMeta = ExportSyndicates[request.Operation.AffiliationTag];

    let gainedStanding = 0;
    request.Operation.Items.forEach(item => {
        const medallion = (syndicateMeta.medallions ?? []).find(medallion => medallion.itemType == item.ItemType);
        if (medallion) {
            gainedStanding += medallion.standing * item.ItemCount;
        }

        item.ItemCount *= -1;
    });

    const inventory = await getInventory(accountId);
    addMiscItems(inventory, request.Operation.Items);

    let syndicate = inventory.Affiliations.find(x => x.Tag == request.Operation.AffiliationTag);
    if (!syndicate) {
        syndicate =
            inventory.Affiliations[
                inventory.Affiliations.push({ Tag: request.Operation.AffiliationTag, Standing: 0 }) - 1
            ];
    }

    const max = getMaxStanding(syndicateMeta, syndicate.Title ?? 0);
    if (syndicate.Standing + gainedStanding > max) {
        gainedStanding = max - syndicate.Standing;
    }

    if (syndicateMeta.medallionsCappedByDailyLimit) {
        if (gainedStanding > getStandingLimit(inventory, syndicateMeta.dailyLimitBin)) {
            gainedStanding = getStandingLimit(inventory, syndicateMeta.dailyLimitBin);
        }
        updateStandingLimit(inventory, syndicateMeta.dailyLimitBin, gainedStanding);
    }

    syndicate.Standing += gainedStanding;

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
