import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { addFusionPoints, getInventory } from "../../services/inventoryService.ts";
import { getGuildForRequestEx, hasGuildPermission } from "../../services/guildService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const addCurrencyController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = req.body as IAddCurrencyRequest;
    let projection = request.currency as string;
    if (request.currency.startsWith("Vault")) projection = "GuildId";
    const inventory = await getInventory(accountId, projection);
    if (request.currency == "FusionPoints") {
        addFusionPoints(inventory, request.delta);
    } else if (request.currency == "VaultRegularCredits" || request.currency == "VaultPremiumCredits") {
        const guild = await getGuildForRequestEx(req, inventory);
        if (await hasGuildPermission(guild, accountId, GuildPermission.Treasurer)) {
            guild[request.currency] ??= 0;
            guild[request.currency]! += request.delta;
            await guild.save();
        }
    } else {
        inventory[request.currency] += request.delta;
    }
    if (!request.currency.startsWith("Vault")) {
        await inventory.save();
        broadcastInventoryUpdate(req);
    }
    res.end();
};

interface IAddCurrencyRequest {
    currency:
        | "RegularCredits"
        | "PremiumCredits"
        | "FusionPoints"
        | "PrimeTokens"
        | "VaultRegularCredits"
        | "VaultPremiumCredits";
    delta: number;
}
