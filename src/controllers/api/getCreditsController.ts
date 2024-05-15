import { RequestHandler } from "express";
import { config } from "@/src/services/configService";
import { getInventory } from "@/src/services/inventoryService";
import { parseString } from "@/src/helpers/general";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const getCreditsController: RequestHandler = async (req, res) => {
    if (config.infiniteResources) {
        res.json({
            RegularCredits: 999999999,
            TradesRemaining: 999999999,
            PremiumCreditsFree: 999999999,
            PremiumCredits: 999999999
        });
        return;
    }

    const accountId = parseString(req.query.accountId);

    const inventory = await getInventory(accountId);
    res.json({
        RegularCredits: inventory.RegularCredits,
        TradesRemaining: inventory.TradesRemaining,
        PremiumCreditsFree: inventory.PremiumCreditsFree,
        PremiumCredits: inventory.PremiumCredits
    });
};
