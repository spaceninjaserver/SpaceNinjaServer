import { GuildMember } from "../../models/guildModel.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const declineGuildInviteController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);

    await GuildMember.deleteOne({
        accountId: accountId,
        guildId: req.query.clanId as string
    });

    res.end();
};
