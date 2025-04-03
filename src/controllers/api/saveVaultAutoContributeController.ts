import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Guild } from "@/src/models/guildModel";
import { hasGuildPermission } from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
import { RequestHandler } from "express";

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
