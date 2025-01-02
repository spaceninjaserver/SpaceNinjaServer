import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addMiscItems, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";
import { ExportResources } from "warframe-public-export-plus";

export const fishmongerController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const body = getJSONfromString(String(req.body)) as IFishmongerRequest;
    const miscItemChanges: IMiscItem[] = [];
    let syndicateTag: string | undefined;
    let standingChange = 0;
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
            standingChange += fishData.standingBonus! * fish.ItemCount;
        }
        miscItemChanges.push({ ItemType: fish.ItemType, ItemCount: fish.ItemCount * -1 });
    }
    addMiscItems(inventory, miscItemChanges);
    if (standingChange && syndicateTag) {
        const syndicate = inventory.Affiliations.find(x => x.Tag == syndicateTag);
        if (syndicate !== undefined) {
            syndicate.Standing += standingChange;
        } else {
            inventory.Affiliations.push({
                Tag: syndicateTag,
                Standing: standingChange
            });
        }
    }
    await inventory.save();
    res.json({
        InventoryChanges: {
            MiscItems: miscItemChanges
        },
        SyndicateTag: syndicateTag,
        StandingChange: standingChange
    });
};

interface IFishmongerRequest {
    Fish: IMiscItem[];
}
