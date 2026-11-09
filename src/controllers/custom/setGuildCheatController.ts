import { Guild, GuildMember } from "../../models/guildModel.ts";
import { clanLockCheats } from "../../services/clanCheatsService.ts";
import { getGuildIdForRequestEx } from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { broadcastGuildUpdate } from "../../services/wsService.ts";
import type { IGuildCheats } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";

export const setGuildCheatController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const guildId = getGuildIdForRequestEx(req, await getInventory(accountId, "GuildId"));
    const member = await GuildMember.findOne({ accountId: accountId, guildId: guildId }, "rank");

    if (member && member.rank <= 1) {
        const payload = req.body as ISetGuildCheatRequest;
        const meta = payload.value ? clanLockCheats[payload.key] : undefined;

        if (meta) {
            const guild = (await Guild.findById(guildId))!;
            guild.set(payload.key, payload.value);
            await guild.save();
            if (!meta.isGuildInIdealState(guild)) {
                res.send("retroactivable");
            }
        } else {
            await Guild.updateOne({ _id: guildId }, { [payload.key]: payload.value });
        }
        broadcastGuildUpdate(req, guildId.toString());
    }
    res.end();
};

interface ISetGuildCheatRequest {
    key: keyof IGuildCheats;
    value: boolean;
}
