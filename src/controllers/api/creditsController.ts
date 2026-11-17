import type { RequestHandler } from "express";
import { getAccountForRequest, getBuildVersion } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import gameToBuildVersionInt from "../../constants/gameToBuildVersionInt.ts";

export const creditsController: RequestHandler = async (req, res) => {
    // U9 and below are known to sometimes send this request without credentials, so just handle it more gracefully.
    if (!req.query.accountId) {
        res.sendStatus(400);
        return;
    }

    const account = await getAccountForRequest(req);
    const buildVersion = getBuildVersion(req, account);
    const inventory = await getInventory(
        account._id,
        "RegularCredits TradesRemaining PremiumCreditsFree PremiumCredits infiniteCredits infinitePlatinum infiniteTrades"
    );

    const response: ICreditsResponse = {
        RegularCredits: inventory.infiniteCredits ? 999999999 : inventory.RegularCredits,
        PremiumCredits: inventory.infinitePlatinum ? 999999999 : inventory.PremiumCredits
    };
    if (buildVersion > gameToBuildVersionInt["10.8.0"]) {
        response.PremiumCreditsFree = inventory.infinitePlatinum ? 0 : inventory.PremiumCreditsFree;
        if (buildVersion >= gameToBuildVersionInt["15.0.0"]) {
            response.TradesRemaining = inventory.TradesRemaining;
        }
    }
    res.json(response);
};

interface ICreditsResponse {
    RegularCredits: number;
    PremiumCredits: number;
    PremiumCreditsFree?: number;
    TradesRemaining?: number;
}
