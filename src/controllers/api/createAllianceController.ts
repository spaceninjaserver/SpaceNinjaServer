import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Alliance, AllianceMember, Guild, GuildMember } from "../../models/guildModel.ts";
import { getAllianceClient } from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { broadcastGuildUpdate } from "../../services/wsService.ts";
import { eGuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";

export const createAllianceController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id, "GuildId");
    const guild = (await Guild.findById(inventory.GuildId!, "Name Tier AllianceId"))!;
    if (guild.AllianceId) {
        res.status(400).send("Guild is already in an alliance").end();
        return;
    }
    const guildMember = (await GuildMember.findOne({ guildId: guild._id, accountId: account._id }, "rank"))!;
    if (guildMember.rank > 1) {
        res.status(400).send("Invalid permission").end();
        return;
    }
    const data: ICreateAllianceRequest = req.body
        ? getJSONfromString<ICreateAllianceRequest>(String(req.body))
        : { allianceName: decodeURIComponent(req.query.allianceName as string) };
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
                eGuildPermission.Ruler |
                eGuildPermission.Promoter |
                eGuildPermission.Recruiter |
                eGuildPermission.Treasurer |
                eGuildPermission.ChatModerator |
                eGuildPermission.Tactician
        })
    ]);
    res.json(await getAllianceClient(alliance, guild, account.BuildLabel));
    broadcastGuildUpdate(req, guild._id.toString());
};

interface ICreateAllianceRequest {
    allianceName: string;
}
