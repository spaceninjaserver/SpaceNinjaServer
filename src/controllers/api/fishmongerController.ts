import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { addMiscItems, addStanding, getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IMiscItem } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";
import { ExportResources } from "warframe-public-export-plus";

export const fishmongerController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const body = getJSONfromString<IFishmongerRequest>(String(req.body));
    const miscItemChanges: IMiscItem[] = [];
    let syndicateTag: string | undefined;
    let gainedStanding = 0;
    for (const fish of body.Fish) {
        const fishData = ExportResources[fish.ItemType];
        if (req.query.dissect == "1") {
            for (const part of fishData.dissectionParts!) {
                const partItem = miscItemChanges.find(x => x.ItemType == part.ItemType);
                if (partItem) {
                    partItem.ItemCount += part.ItemCount * fish.ItemCount;
                } else {
                    miscItemChanges.push({ ItemType: part.ItemType, ItemCount: part.ItemCount * fish.ItemCount });
                }
            }
        } else {
            syndicateTag = fishData.syndicateTag!;
            gainedStanding += fishData.standingBonus! * fish.ItemCount;
        }
        miscItemChanges.push({ ItemType: fish.ItemType, ItemCount: fish.ItemCount * -1 });
    }
    addMiscItems(inventory, miscItemChanges);
    if (gainedStanding && syndicateTag) addStanding(inventory, syndicateTag, gainedStanding);
    await inventory.save();
    res.json({
        InventoryChanges: {
            MiscItems: miscItemChanges
        },
        SyndicateTag: syndicateTag,
        StandingChange: gainedStanding
    });
};

interface IFishmongerRequest {
    Fish: IMiscItem[];
}
