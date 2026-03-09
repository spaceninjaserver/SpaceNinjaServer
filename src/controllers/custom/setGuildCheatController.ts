import { GuildMember } from "../../models/guildModel.ts";
import { getGuildForRequest } from "../../services/guildService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IGuildCheats } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";

export const setGuildCheatController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = req.body as ISetGuildCheatRequest;
    const guild = await getGuildForRequest(req, accountId);
    const member = await GuildMember.findOne({ accountId: accountId, guildId: guild._id });

    if (member) {
        if (member.rank > 1) {
            res.end();
            return;
        }
        guild[payload.key] = payload.value;
        await guild.save();
    }
    res.end();
};

interface ISetGuildCheatRequest {
    key: keyof IGuildCheats;
    value: boolean;
}
