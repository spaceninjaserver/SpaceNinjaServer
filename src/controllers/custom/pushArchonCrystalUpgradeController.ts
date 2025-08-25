import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";

export const pushArchonCrystalUpgradeController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const suit = inventory.Suits.id(req.query.oid as string);
    if (suit) {
        suit.ArchonCrystalUpgrades ??= [];
        const count = (req.query.count as number | undefined) ?? 1;
        if (count >= 1 && count <= 10000) {
            for (let i = 0; i != count; ++i) {
                suit.ArchonCrystalUpgrades.push({ UpgradeType: req.query.type as string });
            }
            await inventory.save();
            res.end();
            return;
        }
    }
    res.status(400).end();
};
