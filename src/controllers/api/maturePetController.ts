import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const maturePetController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "KubrowPets");
    const data = getJSONfromString<IMaturePetRequest>(String(req.body));
    const details = inventory.KubrowPets.id(data.petId)!.Details!;
    details.IsPuppy = data.revert;
    await inventory.save();
    res.json({
        petId: data.petId,
        updateCollar: true,
        armorSkins: ["", "", ""],
        furPatterns: data.revert
            ? ["", "", ""]
            : [details.DominantTraits.FurPattern, details.DominantTraits.FurPattern, details.DominantTraits.FurPattern],
        unmature: data.revert
    });
    broadcastInventoryUpdate(req);
};

interface IMaturePetRequest {
    petId: string;
    revert: boolean;
}
