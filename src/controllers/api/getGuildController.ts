import { RequestHandler } from "express";
import { Guild } from "@/src/models/guildModel";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { logger } from "@/src/utils/logger";
import { getInventory } from "@/src/services/inventoryService";
import { getGuildClient } from "@/src/services/guildService";

const getGuildController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    if (inventory.GuildId) {
        const guild = await Guild.findOne({ _id: inventory.GuildId });
        if (guild) {
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
    res.json({});
};

export { getGuildController };
