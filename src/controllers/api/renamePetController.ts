import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory, updateCurrency } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const renamePetController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "KubrowPets PremiumCredits PremiumCreditsFree");
    const data = getJSONfromString<IRenamePetRequest>(String(req.body));
    const details = inventory.KubrowPets.id(data.petId)!.Details!;
    details.Name = data.name;
    const currencyChanges = updateCurrency(inventory, 15, true);
    await inventory.save();
    res.json({
        ...data,
        inventoryChanges: currencyChanges
    });
};

interface IRenamePetRequest {
    petId: string;
    name: string;
}
