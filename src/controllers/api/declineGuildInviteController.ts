import { GuildMember } from "../../models/guildModel.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const declineGuildInviteController: RequestHandler = async (req, res) => {
    const accountId = await getAccountForRequest(req);

    await GuildMember.deleteOne({
        accountId: accountId,
        guildId: req.query.clanId as string
    });

    res.end();
};
