import type { RequestHandler } from "express";
import { ExportResources } from "warframe-public-export-plus";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { addFusionTreasures, addMiscItem, addMiscItems, getInventory } from "../../services/inventoryService.ts";
import type { IFusionTreasureClientLegacy, IMiscItem } from "../../types/inventoryTypes/inventoryTypes.ts";
import { fromOid, parseFusionTreasure } from "../../helpers/inventoryHelpers.ts";

interface IFusionTreasureRequest {
    oldTreasureName: string;
    newTreasureName: string;
}

export const fusionTreasuresController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "HybridFusionTreasures MiscItems");
    const request = JSON.parse(String(req.body)) as IFusionTreasureRequest | IFusionTreasureClientLegacy;
    if ("ItemId" in request) {
        const fusex = inventory.HybridFusionTreasures.id(fromOid(request.ItemId))!;
        const newSockets = convertLegacySocketsToBitset(request.Sockets);
        const filledSockets = newSockets & ~fusex.Sockets;

        // Update treasure
        fusex.Sockets = newSockets;

        // Remove consumed stars
        for (let i = 0; filledSockets >> i; ++i) {
            if ((filledSockets >> i) & 1) {
                //console.log("Socket", i, "has been filled with", ExportResources[fusex.ItemType].sockets![i]);
                addMiscItem(inventory, ExportResources[fusex.ItemType].sockets![i], -1);
            }
        }

        await inventory.save();
        res.end();
    } else {
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
    }
};

const convertLegacySocketsToBitset = (Sockets: Record<string, string>): number => {
    let bitset = 0;
    for (const key in Sockets) {
        bitset |= 1 << (key.charCodeAt(0) - 0x61);
    }
    return bitset;
};
