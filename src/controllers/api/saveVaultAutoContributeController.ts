import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Guild } from "../../models/guildModel.ts";
import { hasGuildPermission } from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";

export const saveVaultAutoContributeController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId");
    const guild = (await Guild.findById(inventory.GuildId!, "Ranks AutoContributeFromVault"))!;
    if (!(await hasGuildPermission(guild, accountId, GuildPermission.Treasurer))) {
        res.status(400).send("Invalid permission").end();
        return;
    }
    const data = getJSONfromString<ISetVaultAutoContributeRequest>(String(req.body));
    guild.AutoContributeFromVault = data.autoContributeFromVault;
    await guild.save();
    res.end();
};

interface ISetVaultAutoContributeRequest {
    autoContributeFromVault: boolean;
}
