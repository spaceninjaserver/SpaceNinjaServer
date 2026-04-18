import { GuildMember } from "../../models/guildModel.ts";
import { clanLockCheats } from "../../services/clanCheatsService.ts";
import { getGuildForRequest } from "../../services/guildService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { broadcastGuildUpdate } from "../../services/wsService.ts";
import type { IGuildCheats } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";

export const setGuildCheatController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const guild = await getGuildForRequest(req, accountId);
    const member = await GuildMember.findOne({ accountId: accountId, guildId: guild._id });

    if (member && member.rank <= 1) {
        const payload = req.body as ISetGuildCheatRequest;
        const meta = payload.value ? clanLockCheats[payload.key] : undefined;

        guild[payload.key] = payload.value;
        await guild.save();
        broadcastGuildUpdate(req, guild._id.toString());

        if (meta && !meta.isGuildInIdealState(guild)) {
            res.send("retroactivable");
        }
    }
    res.end();
};

interface ISetGuildCheatRequest {
    key: keyof IGuildCheats;
    value: boolean;
}
