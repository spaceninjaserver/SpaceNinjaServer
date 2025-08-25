import { getGuildForRequest, hasGuildPermission } from "../../services/guildService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IGuildRank } from "../../types/guildTypes.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";

export const customizeGuildRanksController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const guild = await getGuildForRequest(req);
    const payload = JSON.parse(String(req.body)) as ICustomizeGuildRanksRequest;
    if (!(await hasGuildPermission(guild, accountId, GuildPermission.Ruler))) {
        res.status(400).json("Invalid permission");
        return;
    }
    guild.Ranks = payload.GuildRanks;
    await guild.save();
    res.end();
};

interface ICustomizeGuildRanksRequest {
    GuildRanks: IGuildRank[];
}
