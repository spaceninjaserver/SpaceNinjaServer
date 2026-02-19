import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory, updateCurrency } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import type { RequestHandler } from "express";

export const releasePetController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "RegularCredits KubrowPets PendingRecipes");
    const payload = getJSONfromString<IReleasePetRequest>(String(req.body));

    const cost = payload.recipeName == "/Lotus/Types/Game/KubrowPet/ReleasePetRecipe" ? 25000 : 0;
    const inventoryChanges = updateCurrency(inventory, cost, false);

    inventoryChanges.RemovedIdItems = [{ ItemId: { $oid: payload.petId } }];
    inventory.KubrowPets.pull({ _id: payload.petId });
    inventory.PendingRecipes.pull({ KubrowPet: payload.petId });

    await inventory.save();
    res.json({
        petId: payload.petId, // 2018.02.22.14.34
        cost, // 2018.02.22.14.34
        inventoryChanges // Not a mistake; it's "inventoryChanges" here.
    });
    broadcastInventoryUpdate(req);
};

interface IReleasePetRequest {
    recipeName: "/Lotus/Types/Game/KubrowPet/ReleasePetRecipe" | "webui";
    petId: string;
}
