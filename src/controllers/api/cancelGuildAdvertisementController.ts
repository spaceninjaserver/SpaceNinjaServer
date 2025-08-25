import { GuildAd } from "../../models/guildModel.ts";
import { getGuildForRequestEx, hasGuildPermission } from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";

export const cancelGuildAdvertisementController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!(await hasGuildPermission(guild, accountId, GuildPermission.Advertiser))) {
        res.status(400).end();
        return;
    }

    await GuildAd.deleteOne({ GuildId: guild._id });

    res.end();
};
