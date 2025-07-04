import { fromMongoDate, fromOid } from "@/src/helpers/inventoryHelpers";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addMiscItem, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IEquipmentClient } from "@/src/types/equipmentTypes";
import { RequestHandler } from "express";

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
