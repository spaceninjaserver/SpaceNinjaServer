import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Alliance, AllianceMember, Guild, GuildMember } from "../../models/guildModel.ts";
import { getAllianceClient } from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";

export const createAllianceController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId");
    const guild = (await Guild.findById(inventory.GuildId!, "Name Tier AllianceId"))!;
    if (guild.AllianceId) {
        res.status(400).send("Guild is already in an alliance").end();
        return;
    }
    const guildMember = (await GuildMember.findOne({ guildId: guild._id, accountId }, "rank"))!;
    if (guildMember.rank > 1) {
        res.status(400).send("Invalid permission").end();
        return;
    }
    const data = getJSONfromString<ICreateAllianceRequest>(String(req.body));
    const alliance = new Alliance({ Name: data.allianceName });
    try {
        await alliance.save();
    } catch (e) {
        res.status(400).send("Alliance name already in use").end();
        return;
    }
    guild.AllianceId = alliance._id;
    await Promise.all([
        guild.save(),
        AllianceMember.insertOne({
            allianceId: alliance._id,
            guildId: guild._id,
            Pending: false,
            Permissions:
                GuildPermission.Ruler |
                GuildPermission.Promoter |
                GuildPermission.Recruiter |
                GuildPermission.Treasurer |
                GuildPermission.ChatModerator
        })
    ]);
    res.json(await getAllianceClient(alliance, guild));
};

interface ICreateAllianceRequest {
    allianceName: string;
}
