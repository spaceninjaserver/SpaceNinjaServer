import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";

export const creditsController: RequestHandler = async (req, res) => {
    const inventory = (
        await Promise.all([
            getAccountIdForRequest(req),
            getInventory(
                req.query.accountId as string,
                "RegularCredits TradesRemaining PremiumCreditsFree PremiumCredits infiniteCredits infinitePlatinum"
            )
        ])
    )[1];

    const response = {
        RegularCredits: inventory.RegularCredits,
        TradesRemaining: inventory.TradesRemaining,
        PremiumCreditsFree: inventory.PremiumCreditsFree,
        PremiumCredits: inventory.PremiumCredits
    };

    if (inventory.infiniteCredits) {
        response.RegularCredits = 999999999;
    }
    if (inventory.infinitePlatinum) {
        response.PremiumCreditsFree = 0;
        response.PremiumCredits = 999999999;
    }

    res.json(response);
};
