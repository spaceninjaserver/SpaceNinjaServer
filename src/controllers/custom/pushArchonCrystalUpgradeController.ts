import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const pushArchonCrystalUpgradeController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const suit = inventory.Suits.find(suit => suit._id.toString() == (req.query.oid as string));
    if (suit) {
        suit.ArchonCrystalUpgrades ??= [];
        const count = (req.query.count as number | undefined) ?? 1;
        if (count >= 1 && count <= 10000) {
            for (let i = 0; i != count; ++i) {
                suit.ArchonCrystalUpgrades.push({ UpgradeType: req.query.type as string });
            }
            await inventory.save();
            res.end();
        }
    }
    res.status(400).end();
};
