import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { eStatus } from "../../types/equipmentTypes.ts";
import type { RequestHandler } from "express";

export const retrievePetFromStasisController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "KubrowPets");
    const data = getJSONfromString<IRetrievePetFromStasisRequest>(String(req.body));

    let oldPetId: string | undefined;
    for (const pet of inventory.KubrowPets) {
        if (pet.Details.Status == eStatus.StatusAvailable) {
            pet.Details.Status = eStatus.StatusStasis;
            oldPetId = pet._id.toString();
            break;
        }
    }

    inventory.KubrowPets.id(data.petId)!.Details.Status = eStatus.StatusAvailable;

    await inventory.save();
    res.json({
        petId: data.petId,
        oldPetId,
        status: eStatus.StatusAvailable
    });
};

interface IRetrievePetFromStasisRequest {
    petId: string;
}
