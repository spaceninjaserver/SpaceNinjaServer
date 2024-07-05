import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

export interface IFusionTreasuresRequest {
    oldTreasureName: string;
    newTreasureName: string;
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const fusionTreasuresController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    // {"oldTreasureName":"/Lotus/Types/Items/FusionTreasures/OroFusexG_01","newTreasureName":"/Lotus/Types/Items/FusionTreasures/OroFusexG_05"}
    const payload = getJSONfromString(String(req.body)) as IFusionTreasuresRequest;
    const newTreasureName = payload.newTreasureName;
    const treasureName = newTreasureName.substring(0, newTreasureName.lastIndexOf("_"));
    const sockets = newTreasureName.substring(newTreasureName.lastIndexOf("_") + 1);
    console.log("fusionTreasure:" + treasureName + " " + sockets);
    const fusionTreasureIndex = inventory.FusionTreasures.findIndex(ft =>
        payload.oldTreasureName.includes(ft.ItemType)
    );
    inventory.FusionTreasures[fusionTreasureIndex].Sockets = parseInt(sockets, 16);
    // todo
    // remove /Lotus/Types/Items/FusionTreasures/OroFusexOrnamentA
    // remove /Lotus/Types/Items/FusionTreasures/OroFusexOrnamentB
    await inventory.save();
    res.json({
        InventoryChanges: {
            FusionTreasures: [inventory.FusionTreasures[fusionTreasureIndex]]
        }
    });
};

export { fusionTreasuresController };
