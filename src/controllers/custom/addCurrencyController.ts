import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";

export const addCurrencyController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const request = req.body as IAddCurrencyRequest;
    inventory[request.currency] += request.delta;
    await inventory.save();
    res.end();
};

interface IAddCurrencyRequest {
    currency: "RegularCredits" | "PremiumCredits" | "FusionPoints" | "PrimeTokens";
    delta: number;
}
