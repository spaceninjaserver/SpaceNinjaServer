import { RequestHandler } from "express";
import { config } from "@/src/services/configService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const getCreditsController: RequestHandler = async (req, res) => {
    let accountId;
    try {
        accountId = await getAccountIdForRequest(req);
    } catch (e) {
        res.status(400).send("Log-in expired");
        return;
    }

    if (config.infiniteResources) {
        res.json({
            RegularCredits: 999999999,
            TradesRemaining: 999999999,
            PremiumCreditsFree: 999999999,
            PremiumCredits: 999999999
        });
        return;
    }
	
	if (config.infinitePlatinum) {
        res.json({
            RegularCredits: inventory.RegularCredits,
			TradesRemaining: inventory.TradesRemaining,
            PremiumCreditsFree: 999999999,
            PremiumCredits: 999999999
        });
        return;
    }

    const inventory = await getInventory(accountId);
    res.json({
        RegularCredits: inventory.RegularCredits,
        TradesRemaining: inventory.TradesRemaining,
        PremiumCreditsFree: inventory.PremiumCreditsFree,
        PremiumCredits: inventory.PremiumCredits
    });
};
