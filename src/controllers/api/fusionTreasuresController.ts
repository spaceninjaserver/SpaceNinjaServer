import type { RequestHandler } from "express";
import { ExportResources } from "warframe-public-export-plus";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { addFusionTreasures, addMiscItems, getInventory } from "../../services/inventoryService.ts";
import type { IMiscItem } from "../../types/inventoryTypes/inventoryTypes.ts";
import { parseFusionTreasure } from "../../helpers/inventoryHelpers.ts";

interface IFusionTreasureRequest {
    oldTreasureName: string;
    newTreasureName: string;
}

export const fusionTreasuresController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const request = JSON.parse(String(req.body)) as IFusionTreasureRequest;

    // Swap treasures
    const oldTreasure = parseFusionTreasure(request.oldTreasureName, -1);
    const newTreasure = parseFusionTreasure(request.newTreasureName, 1);
    const fusionTreasureChanges = [oldTreasure, newTreasure];
    addFusionTreasures(inventory, fusionTreasureChanges);

    // Remove consumed stars
    const miscItemChanges: IMiscItem[] = [];
    const filledSockets = newTreasure.Sockets & ~oldTreasure.Sockets;
    for (let i = 0; filledSockets >> i; ++i) {
        if ((filledSockets >> i) & 1) {
            //console.log("Socket", i, "has been filled with", ExportResources[oldTreasure.ItemType].sockets![i]);
            miscItemChanges.push({
                ItemType: ExportResources[oldTreasure.ItemType].sockets![i],
                ItemCount: -1
            });
        }
    }
    addMiscItems(inventory, miscItemChanges);

    await inventory.save();
    // The response itself is the inventory changes for this endpoint.
    res.json({
        MiscItems: miscItemChanges,
        FusionTreasures: fusionTreasureChanges
    });
};
