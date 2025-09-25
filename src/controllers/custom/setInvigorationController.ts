import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const setInvigorationController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = req.body as ISetInvigorationRequest;
    const inventory = await getInventory(accountId, "Suits");
    const suit = inventory.Suits.id(request.oid);
    if (suit) {
        const hasUpgrades = request.DefensiveUpgrade && request.OffensiveUpgrade && request.UpgradesExpiry;
        suit.DefensiveUpgrade = hasUpgrades ? request.DefensiveUpgrade : undefined;
        suit.OffensiveUpgrade = hasUpgrades ? request.OffensiveUpgrade : undefined;
        suit.UpgradesExpiry = hasUpgrades ? new Date(request.UpgradesExpiry) : undefined;
        await inventory.save();
        broadcastInventoryUpdate(req);
    }
    res.end();
};

interface ISetInvigorationRequest {
    oid: string;
    DefensiveUpgrade: string;
    OffensiveUpgrade: string;
    UpgradesExpiry: number;
}
