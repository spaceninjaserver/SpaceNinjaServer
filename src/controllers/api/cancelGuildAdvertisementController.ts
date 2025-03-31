import { GuildAd } from "@/src/models/guildModel";
import { getGuildForRequestEx, hasGuildPermission } from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
import { RequestHandler } from "express";

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
