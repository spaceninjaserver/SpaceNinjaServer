import { GuildMember } from "../../models/guildModel.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import { broadcastGuildUpdate } from "../../services/wsService.ts";

export const declineGuildInviteController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const guildId = req.query.clanId as string;
    await GuildMember.deleteOne({
        accountId: accountId,
        guildId
    });
    res.end();
    broadcastGuildUpdate(req, guildId);
};
