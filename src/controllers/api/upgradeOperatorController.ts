import { getInventory, updateCurrency } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const upgradeOperatorController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(
        accountId,
        "OperatorCustomizationSlotPurchases PremiumCredits PremiumCreditsFree"
    );
    inventory.OperatorCustomizationSlotPurchases ??= 0;
    inventory.OperatorCustomizationSlotPurchases += 1;
    const inventoryChanges = updateCurrency(inventory, 10, true);
    await inventory.save();
    res.json({ InventoryChanges: inventoryChanges });
};
