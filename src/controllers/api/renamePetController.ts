import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory, updateCurrency } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import type { RequestHandler } from "express";

export const renamePetController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "KubrowPets PremiumCredits PremiumCreditsFree");
    const data = getJSONfromString<IRenamePetRequest>(String(req.body));
    const details = inventory.KubrowPets.id(data.petId)!.Details!;

    details.Name = data.name;

    const inventoryChanges: IInventoryChanges = {};
    if (!("webui" in req.query)) {
        updateCurrency(inventory, 15, true, inventoryChanges);
    }

    await inventory.save();
    res.json({
        ...data,
        inventoryChanges: inventoryChanges
    });
    broadcastInventoryUpdate(req);
};

interface IRenamePetRequest {
    petId: string;
    name: string;
}
