import { fromMongoDate, fromOid } from "../../helpers/inventoryHelpers.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IEquipmentClient } from "../../types/equipmentTypes.ts";
import type { RequestHandler } from "express";

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
