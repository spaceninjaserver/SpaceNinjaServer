import { RequestHandler } from "express";
import { config } from "@/src/services/configService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";

export const getCreditsController: RequestHandler = async (req, res) => {
    let accountId;
    try {
        accountId = await getAccountIdForRequest(req);
    } catch (e) {
        res.status(400).send("Log-in expired");
        return;
    }

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
