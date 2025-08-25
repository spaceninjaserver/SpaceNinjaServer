import type { RequestHandler } from "express";
import { Guild } from "../../models/guildModel.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { logger } from "../../utils/logger.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { createUniqueClanName, getGuildClient } from "../../services/guildService.ts";

export const getGuildController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id.toString(), "GuildId");
    if (inventory.GuildId) {
        const guild = await Guild.findById(inventory.GuildId);
        if (guild) {
            // Handle guilds created before we added discriminators
            if (guild.Name.indexOf("#") == -1) {
                guild.Name = await createUniqueClanName(guild.Name);
                await guild.save();
            }

            if (guild.CeremonyResetDate && Date.now() >= guild.CeremonyResetDate.getTime()) {
                logger.debug(`ascension ceremony is over`);
                guild.CeremonyEndo = undefined;
                guild.CeremonyContributors = undefined;
                guild.CeremonyResetDate = undefined;
                await guild.save();
            }
            res.json(await getGuildClient(guild, account));
            return;
        }
    }
    res.end();
};
