import { RequestHandler } from "express";
import { ExportResources } from "warframe-public-export-plus";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addFusionTreasures, addMiscItems, getInventory } from "@/src/services/inventoryService";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { parseFusionTreasure } from "@/src/helpers/inventoryHelpers";

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
