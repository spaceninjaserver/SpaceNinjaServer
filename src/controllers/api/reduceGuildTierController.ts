import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import {
    getGuildForRequestEx,
    hasAccessToDojo,
    hasGuildPermission,
    setGuildTier
} from "../../services/guildService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import { unixTimesInMs } from "../../constants/timeConstants.ts";

export const reduceGuildTierController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);

    // TOVERIFY: Which permission is required for this?
    if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, account._id, GuildPermission.Ruler))) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }

    await setGuildTier(guild, parseInt(req.query.newTier as string));
    guild.GuildTierIncMoratorium = new Date(Date.now() + unixTimesInMs.day * 60);
    await guild.save();
    res.json({ NewTier: guild.Tier });
};
