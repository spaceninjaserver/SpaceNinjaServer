import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { Status } from "@/src/types/equipmentTypes";
import { RequestHandler } from "express";

export const retrievePetFromStasisController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "KubrowPets");
    const data = getJSONfromString<IRetrievePetFromStasisRequest>(String(req.body));

    let oldPetId: string | undefined;
    for (const pet of inventory.KubrowPets) {
        if (pet.Details!.Status == Status.StatusAvailable) {
            pet.Details!.Status = Status.StatusStasis;
            oldPetId = pet._id.toString();
            break;
        }
    }

    inventory.KubrowPets.id(data.petId)!.Details!.Status = Status.StatusAvailable;

    await inventory.save();
    res.json({
        petId: data.petId,
        oldPetId,
        status: Status.StatusAvailable
    });
};

interface IRetrievePetFromStasisRequest {
    petId: string;
}
