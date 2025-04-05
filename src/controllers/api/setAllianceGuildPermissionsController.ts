import { AllianceMember, GuildMember } from "@/src/models/guildModel";
import { getAccountForRequest } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
import { RequestHandler } from "express";

export const setAllianceGuildPermissionsController: RequestHandler = async (req, res) => {
    // Check requester is a warlord in their guild
    const account = await getAccountForRequest(req);
    const guildMember = (await GuildMember.findOne({ accountId: account._id, status: 0 }))!;
    if (guildMember.rank > 1) {
        res.status(400).end();
        return;
    }

    // Check guild is the creator of the alliance and don't allow changing of own permissions. (Technically changing permissions requires the Promoter permission, but both are exclusive to the creator guild.)
    const allianceMember = (await AllianceMember.findOne({
        guildId: guildMember.guildId,
        Pending: false
    }))!;
    if (
        !(allianceMember.Permissions & GuildPermission.Ruler) ||
        allianceMember.guildId.equals(req.query.guildId as string)
    ) {
        res.status(400).end();
        return;
    }

    const targetAllianceMember = (await AllianceMember.findOne({
        allianceId: allianceMember.allianceId,
        guildId: req.query.guildId
    }))!;
    targetAllianceMember.Permissions =
        parseInt(req.query.perms as string) &
        (GuildPermission.Recruiter | GuildPermission.Treasurer | GuildPermission.ChatModerator);
    await targetAllianceMember.save();

    res.end();
};
