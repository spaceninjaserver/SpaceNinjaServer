import { AllianceMember, GuildMember } from "@/src/models/guildModel";
import { getAccountIdForRequest } from "@/src/services/loginService";
import type { RequestHandler } from "express";

export const declineAllianceInviteController: RequestHandler = async (req, res) => {
    // Check requester is a warlord in their guild
    const accountId = await getAccountIdForRequest(req);
    const guildMember = (await GuildMember.findOne({ accountId, status: 0 }))!;
    if (guildMember.rank > 1) {
        res.status(400).json({ Error: 104 });
        return;
    }

    await AllianceMember.deleteOne({ allianceId: req.query.allianceId, guildId: guildMember.guildId });

    res.end();
};
