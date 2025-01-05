import { RequestHandler } from "express";
import { config } from "@/src/services/configService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";

export const creditsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);

    const inventory = await getInventory(accountId);

    const response = {
        RegularCredits: inventory.RegularCredits,
        TradesRemaining: inventory.TradesRemaining,
        PremiumCreditsFree: inventory.PremiumCreditsFree,
        PremiumCredits: inventory.PremiumCredits
    };

    if (config.infiniteCredits) {
        response.RegularCredits = 999999999;
    }
    if (config.infinitePlatinum) {
        response.PremiumCreditsFree = 999999999;
        response.PremiumCredits = 999999999;
    }

    res.json(response);
};
