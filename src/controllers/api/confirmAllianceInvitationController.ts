import { Alliance, AllianceMember, Guild, GuildMember } from "@/src/models/guildModel";
import { getAllianceClient } from "@/src/services/guildService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const confirmAllianceInvitationController: RequestHandler = async (req, res) => {
    // Check requester is a warlord in their guild
    const accountId = await getAccountIdForRequest(req);
    const guildMember = (await GuildMember.findOne({ accountId, status: 0 }))!;
    if (guildMember.rank > 1) {
        res.status(400).json({ Error: 104 });
        return;
    }

    const allianceMember = await AllianceMember.findOne({
        allianceId: req.query.allianceId,
        guildId: guildMember.guildId
    });
    if (!allianceMember || !allianceMember.Pending) {
        res.status(400);
        return;
    }
    allianceMember.Pending = false;

    const guild = (await Guild.findById(guildMember.guildId))!;
    guild.AllianceId = allianceMember.allianceId;

    await Promise.all([allianceMember.save(), guild.save()]);

    // Give client the new alliance data which uses "AllianceId" instead of "_id" in this response
    const alliance = (await Alliance.findById(allianceMember.allianceId))!;
    const { _id, ...rest } = await getAllianceClient(alliance, guild);
    res.json({
        AllianceId: _id,
        ...rest
    });
};
