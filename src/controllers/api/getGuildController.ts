import { RequestHandler } from "express";
import { Guild } from "@/src/models/guildModel";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { logger } from "@/src/utils/logger";
import { getInventory } from "@/src/services/inventoryService";
import { createUniqueClanName, getGuildClient } from "@/src/services/guildService";

const getGuildController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId");
    if (inventory.GuildId) {
        const guild = await Guild.findOne({ _id: inventory.GuildId });
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
            res.json(await getGuildClient(guild, accountId));
            return;
        }
    }
    res.sendStatus(200);
};

export { getGuildController };
