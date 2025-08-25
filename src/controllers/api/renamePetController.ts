import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory, updateCurrency } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { sendWsBroadcastTo } from "@/src/services/wsService";
import type { IInventoryChanges } from "@/src/types/purchaseTypes";
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
    sendWsBroadcastTo(accountId, { update_inventory: true });
};

interface IRenamePetRequest {
    petId: string;
    name: string;
}
