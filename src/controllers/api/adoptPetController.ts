import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const adoptPetController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "KubrowPets");
    const data = getJSONfromString<IAdoptPetRequest>(String(req.body));
    const details = inventory.KubrowPets.id(data.petId)!.Details!;
    details.Name = data.name;
    await inventory.save();
    res.json({
        petId: data.petId,
        newName: data.name
    } satisfies IAdoptPetResponse);
};

interface IAdoptPetRequest {
    petId: string;
    name: string;
}

interface IAdoptPetResponse {
    petId: string;
    newName: string;
}
