import { RequestHandler } from "express";
import { ExportResources } from "warframe-public-export-plus";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addFusionTreasures, addMiscItems, getInventory } from "@/src/services/inventoryService";
import { IFusionTreasure, IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";

interface IFusionTreasureRequest {
    oldTreasureName: string;
    newTreasureName: string;
}

const parseFusionTreasure = (name: string, count: number): IFusionTreasure => {
    const arr = name.split("_");
    return {
        ItemType: arr[0],
        Sockets: parseInt(arr[1], 16),
        ItemCount: count
    };
};

export const fusionTreasuresController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const request = JSON.parse(String(req.body)) as IFusionTreasureRequest;

    const oldTreasure = parseFusionTreasure(request.oldTreasureName, -1);
    const newTreasure = parseFusionTreasure(request.newTreasureName, 1);

    // Swap treasures
    addFusionTreasures(inventory, [oldTreasure]);
    addFusionTreasures(inventory, [newTreasure]);

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
    res.end();
};
