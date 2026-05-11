import { Alliance, Guild } from "../../models/guildModel.ts";
import { getAllianceClient } from "../../services/guildService.ts";
import type { RequestHandler } from "express";
import { BL_LATEST } from "../../constants/gameVersions.ts";

export const getAllianceController: RequestHandler = async (req, res) => {
    const guildId = req.query.guildId;
    if (guildId) {
        const guild = await Guild.findById(guildId, "Name Tier AllianceId");
        if (guild && guild.AllianceId) {
            const alliance = (await Alliance.findById(guild.AllianceId))!;
            res.json(await getAllianceClient(alliance, guild, BL_LATEST));
            return;
        }
    }
    res.end();
};
