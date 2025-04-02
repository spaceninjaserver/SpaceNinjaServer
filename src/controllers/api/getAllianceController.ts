import { Alliance, Guild } from "@/src/models/guildModel";
import { getAllianceClient } from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const getAllianceController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId");
    if (inventory.GuildId) {
        const guild = (await Guild.findById(inventory.GuildId, "Name Tier AllianceId"))!;
        if (guild.AllianceId) {
            const alliance = (await Alliance.findById(guild.AllianceId))!;
            res.json(await getAllianceClient(alliance, guild));
            return;
        }
    }
    res.end();
};

/*interface IGetAllianceRequest {
    memberCount: number;
    clanLeaderName: string;
    clanLeaderId: string;
}*/
