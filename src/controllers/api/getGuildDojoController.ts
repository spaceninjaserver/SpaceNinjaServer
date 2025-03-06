import { RequestHandler } from "express";
import { Types } from "mongoose";
import { Guild } from "@/src/models/guildModel";
import { getDojoClient } from "@/src/services/guildService";

export const getGuildDojoController: RequestHandler = async (req, res) => {
    const guildId = req.query.guildId as string;

    const guild = await Guild.findOne({ _id: guildId });
    if (!guild) {
        res.status(404).end();
        return;
    }

    // Populate dojo info if not present
    if (guild.DojoComponents.length == 0) {
        guild.DojoComponents.push({
            _id: new Types.ObjectId(),
            pf: "/Lotus/Levels/ClanDojo/DojoHall.level",
            ppf: "",
            CompletionTime: new Date(Date.now()),
            DecoCapacity: 600
        });
        await guild.save();
    }

    res.json(getDojoClient(guild, 0));
};
