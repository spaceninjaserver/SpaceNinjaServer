import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import { Status } from "../../types/equipmentTypes.ts";

export const adoptPetController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "KubrowPets");
    const data = getJSONfromString<IAdoptPetRequest>(String(req.body));
    const details = inventory.KubrowPets.id(data.petId)!.Details!;
    details.Name = data.name;
    let canSetActive = true;
    for (const pet of inventory.KubrowPets) {
        if (pet.Details!.Status == Status.StatusAvailable) {
            canSetActive = false;
            break;
        }
    }
    details.Status = canSetActive ? Status.StatusAvailable : Status.StatusStasis;
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
