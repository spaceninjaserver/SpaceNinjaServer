import { getGuildForRequest, hasGuildPermission } from "@/src/services/guildService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { GuildPermission, IGuildRank } from "@/src/types/guildTypes";
import { RequestHandler } from "express";

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
