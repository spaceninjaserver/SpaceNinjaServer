import { RequestHandler } from "express";
import { Types } from "mongoose";
import { Guild } from "@/src/models/guildModel";
import { getDojoClient } from "@/src/services/guildService";
import { Account } from "@/src/models/loginModel";

export const getGuildDojoController: RequestHandler = async (req, res) => {
    const guildId = req.query.guildId as string;

    const guild = await Guild.findById(guildId);
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

    const payload: IGetGuildDojoRequest = req.body ? (JSON.parse(String(req.body)) as IGetGuildDojoRequest) : {};
    const account = await Account.findById(req.query.accountId as string);
    res.json(await getDojoClient(guild, 0, payload.ComponentId, account?.BuildLabel));
};

interface IGetGuildDojoRequest {
    ComponentId?: string;
}
