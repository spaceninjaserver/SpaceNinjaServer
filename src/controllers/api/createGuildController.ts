import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Guild, GuildMember } from "@/src/models/guildModel";
import { updateInventoryForConfirmedGuildJoin } from "@/src/services/guildService";

export const createGuildController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString<ICreateGuildRequest>(String(req.body));

    // Create guild on database
    const guild = new Guild({
        Name: payload.guildName
    });
    await guild.save();

    // Create guild member on database
    await GuildMember.insertOne({
        accountId: accountId,
        guildId: guild._id,
        status: 0,
        rank: 0
    });

    await updateInventoryForConfirmedGuildJoin(accountId, guild._id);

    res.json(guild);
};

interface ICreateGuildRequest {
    guildName: string;
}
