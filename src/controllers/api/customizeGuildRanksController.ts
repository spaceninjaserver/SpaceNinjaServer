import { getGuildForRequest } from "@/src/services/guildService";
import { IGuildRank } from "@/src/types/guildTypes";
import { RequestHandler } from "express";

export const customizeGuildRanksController: RequestHandler = async (req, res) => {
    const guild = await getGuildForRequest(req);
    const payload = JSON.parse(String(req.body)) as ICustomizeGuildRanksRequest;
    // TODO: Verify permissions
    guild.Ranks = payload.GuildRanks;
    await guild.save();
    res.end();
};

interface ICustomizeGuildRanksRequest {
    GuildRanks: IGuildRank[];
}
