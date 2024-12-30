import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addMiscItems, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";
import { ExportResources } from "warframe-public-export-plus";

export const fishmongerController: RequestHandler = async (req, res) => {
    if (!req.query.dissect) {
        throw new Error("expected fishmonger request to be for dissection");
    }
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const body = getJSONfromString(String(req.body)) as IFishmongerRequest;
    const miscItemChanges: IMiscItem[] = [];
    for (const fish of body.Fish) {
        for (const part of ExportResources[fish.ItemType].dissectionParts!) {
            const partItem = miscItemChanges.find(x => x.ItemType == part.ItemType);
            if (partItem) {
                partItem.ItemCount += part.ItemCount;
            } else {
                miscItemChanges.push(part);
            }
        }
        miscItemChanges.push({ ItemType: fish.ItemType, ItemCount: fish.ItemCount * -1 });
    }
    addMiscItems(inventory, miscItemChanges);
    await inventory.save();
    res.json({
        InventoryChanges: {
            MiscItems: miscItemChanges
        }
    });
};

interface IFishmongerRequest {
    Fish: IMiscItem[];
}
