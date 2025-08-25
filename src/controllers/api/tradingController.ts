import { getGuildForRequestEx, hasAccessToDojo, hasGuildPermission } from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";

export const tradingController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    const op = req.query.op as string;
    if (op == "5") {
        if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Treasurer))) {
            res.status(400).send("-1").end();
            return;
        }
        guild.TradeTax = parseInt(req.query.tax as string);
        await guild.save();
        res.send(guild.TradeTax).end();
    } else {
        throw new Error(`unknown trading op: ${op}`);
    }
};
