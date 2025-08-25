import { fromMongoDate, fromOid } from "../../helpers/inventoryHelpers.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { addMiscItem, getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IEquipmentClient } from "../../types/equipmentTypes.ts";
import type { RequestHandler } from "express";

export const umbraController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "Suits MiscItems");
    const payload = getJSONfromString<IUmbraRequest>(String(req.body));
    for (const clientSuit of payload.Suits) {
        const dbSuit = inventory.Suits.id(fromOid(clientSuit.ItemId))!;
        if (clientSuit.UmbraDate) {
            addMiscItem(inventory, "/Lotus/Types/Items/MiscItems/UmbraEchoes", -1);
            dbSuit.UmbraDate = fromMongoDate(clientSuit.UmbraDate);
        } else {
            dbSuit.UmbraDate = undefined;
        }
    }
    await inventory.save();
    res.end();
};

interface IUmbraRequest {
    Suits: IEquipmentClient[];
}
