import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory, updateCurrency } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";
import type { RequestHandler } from "express";

export const releasePetController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "RegularCredits KubrowPets");
    const payload = getJSONfromString<IReleasePetRequest>(String(req.body));

    const inventoryChanges = updateCurrency(
        inventory,
        payload.recipeName == "/Lotus/Types/Game/KubrowPet/ReleasePetRecipe" ? 25000 : 0,
        false
    );

    inventoryChanges.RemovedIdItems = [{ ItemId: { $oid: payload.petId } }];
    inventory.KubrowPets.pull({ _id: payload.petId });

    await inventory.save();
    res.json({ inventoryChanges }); // Not a mistake; it's "inventoryChanges" here.
    sendWsBroadcastTo(accountId, { update_inventory: true });
};

interface IReleasePetRequest {
    recipeName: "/Lotus/Types/Game/KubrowPet/ReleasePetRecipe" | "webui";
    petId: string;
}
