import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const popArchonCrystalUpgradeController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const suit = inventory.Suits.find(suit => suit._id.toString() == (req.query.oid as string));
    if (suit && suit.ArchonCrystalUpgrades) {
        suit.ArchonCrystalUpgrades = suit.ArchonCrystalUpgrades.filter(
            x => x.UpgradeType != (req.query.type as string)
        );
        await inventory.save();
        res.end();
    }
    res.status(400).end();
};
