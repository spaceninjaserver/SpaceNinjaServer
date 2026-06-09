import type { RequestHandler } from "express";
import { getAccountForRequest, hasPermission } from "../../services/loginService.ts";
import { addCrewShipFusionPoints, addFusionPoints, getInventory } from "../../services/inventoryService.ts";
import { getGuildForRequestEx, hasGuildPermission } from "../../services/guildService.ts";
import { eGuildPermission } from "../../types/guildTypes.ts";
import { broadcastGuildUpdate, broadcastInventoryUpdate } from "../../services/wsService.ts";

export const addCurrencyController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const request = req.body as IAddCurrencyRequest;
    let projection = request.currency as string;
    if (request.currency.startsWith("Vault")) projection = "GuildId";
    const inventory = await getInventory(account._id, projection);
    if (request.currency == "VaultRegularCredits" || request.currency == "VaultPremiumCredits") {
        const guild = await getGuildForRequestEx(req, inventory);
        if (await hasGuildPermission(guild, account._id, eGuildPermission.Treasurer)) {
            guild[request.currency] ??= 0;
            guild[request.currency]! += request.delta;
            await guild.save();
            res.json(guild[request.currency]);
            broadcastGuildUpdate(req, guild._id.toString());
        }
    } else {
        if (hasPermission(account, currencyToPermission[request.currency])) {
            switch (request.currency) {
                case "FusionPoints":
                    addFusionPoints(inventory, request.delta);
                    break;
                case "CrewShipFusionPoints":
                    addCrewShipFusionPoints(inventory, request.delta);
                    break;
                default:
                    inventory[request.currency] += request.delta;
                    break;
            }
        }
        res.json(inventory[request.currency]);
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
        | "CrewShipFusionPoints"
        | "PrimeTokens"
        | "VaultRegularCredits"
        | "VaultPremiumCredits";
    delta: number;
}

const currencyToPermission: Record<string, string> = {
    RegularCredits: "addCredits",
    PremiumCredits: "addPlatinum",
    FusionPoints: "addEndo",
    CrewShipFusionPoints: "addDirac",
    PrimeTokens: "addRegalAya"
};
