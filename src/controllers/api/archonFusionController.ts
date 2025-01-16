import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addMiscItems, getInventory } from "@/src/services/inventoryService";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { colorToShard, combineColors, shardToColor } from "@/src/helpers/shardHelper";

export const archonFusionController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = JSON.parse(String(req.body)) as IArchonFusionRequest;
    const inventory = await getInventory(accountId);
    request.Consumed.forEach(x => x.ItemCount * -1);
    addMiscItems(inventory, request.Consumed);
    const newArchons: IMiscItem[] = [];
    switch (request.FusionType) {
        case "AFT_ASCENT":
            newArchons.push({
                ItemType: request.Consumed[0].ItemType + "Mythic",
                ItemCount: 1
            });
            break;

        case "AFT_COALESCENT":
            newArchons.push({
                ItemType:
                    colorToShard[
                        combineColors(
                            shardToColor[request.Consumed[0].ItemType],
                            shardToColor[request.Consumed[1].ItemType]
                        )
                    ],
                ItemCount: 1
            });
            break;

        default:
            throw new Error(`unknown archon fusion type: ${request.FusionType}`);
    }
    addMiscItems(inventory, newArchons);
    await inventory.save();
    res.json({
        NewArchons: newArchons
    });
};

interface IArchonFusionRequest {
    Consumed: IMiscItem[];
    FusionType: string;
    StatResultType: "SRT_NEW_STAT"; // ???
}
