import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IOidWithLegacySupport } from "../../types/commonTypes.ts";
import { getInventory, updateCurrency } from "../../services/inventoryService.ts";
import { fromOid } from "../../helpers/inventoryHelpers.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";

export const refillRevivesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "PremiumCredits PremiumCreditsFree Suits");
    const body = getJSONfromString<IRefillRevivesRequest>(String(req.body));
    const suit = inventory.Suits.id(fromOid(body.SuitId));
    if (suit?.ExtraRemaining !== undefined) {
        suit.ExtraRemaining += body.Count;
        updateCurrency(inventory, 3 * body.Count, true);
        await inventory.save();
    }
    res.json({
        PremiumCredits: inventory.PremiumCredits
    });
};

interface IRefillRevivesRequest {
    SuitId: IOidWithLegacySupport;
    Count: number;
}
