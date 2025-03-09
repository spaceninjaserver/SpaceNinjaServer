import { Guild } from "@/src/models/guildModel";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountForRequest, getSuffixedName } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const setGuildMotdController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id.toString());
    const guild = (await Guild.findOne({ _id: inventory.GuildId! }))!;
    // TODO: Check permissions

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
