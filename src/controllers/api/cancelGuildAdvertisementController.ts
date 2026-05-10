import { GuildAd } from "../../models/guildModel.ts";
import { getGuildForRequest, hasGuildPermission } from "../../services/guildService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { eGuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";

export const cancelGuildAdvertisementController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const guild = await getGuildForRequest(req, accountId);
    if (!(await hasGuildPermission(guild, accountId, eGuildPermission.Advertiser))) {
        res.status(400).end();
        return;
    }

    await GuildAd.deleteOne({ GuildId: guild._id });

    res.end();
};
