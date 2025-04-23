import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addFusionPoints, getInventory } from "@/src/services/inventoryService";

export const addCurrencyController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = req.body as IAddCurrencyRequest;
    const inventory = await getInventory(accountId, request.currency);
    if (request.currency == "FusionPoints") {
        addFusionPoints(inventory, request.delta);
    } else {
        inventory[request.currency] += request.delta;
    }
    await inventory.save();
    res.end();
};

interface IAddCurrencyRequest {
    currency: "RegularCredits" | "PremiumCredits" | "FusionPoints" | "PrimeTokens";
    delta: number;
}
