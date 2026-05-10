import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { freeUpSlot, getInventory, updateCurrency } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import type { RequestHandler } from "express";
import { eInventorySlot } from "../../types/inventoryTypes/inventoryTypes.ts";

export const releasePetController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "RegularCredits KubrowPets PendingRecipes SentinelBin");
    const payload = getJSONfromString<IReleasePetRequest>(String(req.body));

    const cost = payload.recipeName == "/Lotus/Types/Game/KubrowPet/ReleasePetRecipe" ? 25000 : 0;
    const inventoryChanges = updateCurrency(inventory, cost, false);

    inventoryChanges.RemovedIdItems = [{ ItemId: { $oid: payload.petId } }];
    inventory.KubrowPets.pull({ _id: payload.petId });
    inventory.PendingRecipes.pull({ KubrowPet: payload.petId });
    inventoryChanges[eInventorySlot.SENTINELS] = { count: -1, platinum: 0, Slots: 1 };
    freeUpSlot(inventory, eInventorySlot.SENTINELS);

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
