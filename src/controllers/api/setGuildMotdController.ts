import { Guild } from "@/src/models/guildModel";
import { hasGuildPermission } from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountForRequest, getSuffixedName } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
import { RequestHandler } from "express";

export const setGuildMotdController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id.toString(), "GuildId");
    const guild = (await Guild.findById(inventory.GuildId!))!;
    if (!(await hasGuildPermission(guild, account._id, GuildPermission.Herald))) {
        res.status(400).json("Invalid permission");
        return;
    }

    const IsLongMOTD = "longMOTD" in req.query;
    const MOTD = req.body ? String(req.body) : undefined;

    if (IsLongMOTD) {
        if (MOTD) {
            guild.LongMOTD = {
                message: MOTD,
                authorName: getSuffixedName(account)
            };
        } else {
            guild.LongMOTD = undefined;
        }
    } else {
        guild.MOTD = MOTD ?? "";
    }
    await guild.save();

    res.json({ IsLongMOTD, MOTD });
};
