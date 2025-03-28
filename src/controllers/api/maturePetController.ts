import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

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
};

interface IMaturePetRequest {
    petId: string;
    revert: boolean;
}
