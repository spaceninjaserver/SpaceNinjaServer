import { fromMongoDate, fromOid } from "@/src/helpers/inventoryHelpers";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IEquipmentClient } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { RequestHandler } from "express";

export const setSuitInfectionController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "Suits");
    const payload = getJSONfromString<ISetSuitInfectionRequest>(String(req.body));
    for (const clientSuit of payload.Suits) {
        const dbSuit = inventory.Suits.id(fromOid(clientSuit.ItemId))!;
        dbSuit.InfestationDate = fromMongoDate(clientSuit.InfestationDate!);
    }
    await inventory.save();
    res.end();
};

interface ISetSuitInfectionRequest {
    Suits: IEquipmentClient[];
}
