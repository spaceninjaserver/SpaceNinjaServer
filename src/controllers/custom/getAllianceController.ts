import { Alliance, Guild } from "../../models/guildModel.ts";
import { getAllianceClient } from "../../services/guildService.ts";
import type { RequestHandler } from "express";

export const getAllianceController: RequestHandler = async (req, res) => {
    const guildId = req.query.guildId;
    if (guildId) {
        const guild = await Guild.findById(guildId, "Name Tier AllianceId");
        if (guild && guild.AllianceId) {
            const alliance = (await Alliance.findById(guild.AllianceId))!;
            res.json(await getAllianceClient(alliance, guild));
            return;
        }
    }
    res.end();
};
