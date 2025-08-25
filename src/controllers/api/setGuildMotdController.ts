import { version_compare } from "@/src/helpers/inventoryHelpers";
import { Alliance, Guild, GuildMember } from "@/src/models/guildModel";
import { hasGuildPermissionEx } from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountForRequest, getSuffixedName } from "@/src/services/loginService";
import type { ILongMOTD } from "@/src/types/guildTypes";
import { GuildPermission } from "@/src/types/guildTypes";
import type { RequestHandler } from "express";

export const setGuildMotdController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id.toString(), "GuildId");
    const guild = (await Guild.findById(inventory.GuildId!))!;
    const member = (await GuildMember.findOne({ accountId: account._id, guildId: guild._id }))!;

    const IsLongMOTD = "longMOTD" in req.query;
    const MOTD = req.body ? String(req.body) : undefined;

    if ("alliance" in req.query) {
        if (member.rank > 1) {
            res.status(400).json("Invalid permission");
            return;
        }

        const alliance = (await Alliance.findById(guild.AllianceId!))!;
        const motd = MOTD
            ? ({
                  message: MOTD,
                  authorName: getSuffixedName(account),
                  authorGuildName: guild.Name
              } satisfies ILongMOTD)
            : undefined;
        if (IsLongMOTD) {
            alliance.LongMOTD = motd;
        } else {
            alliance.MOTD = motd;
        }
        await alliance.save();
    } else {
        if (!hasGuildPermissionEx(guild, member, GuildPermission.Herald)) {
            res.status(400).json("Invalid permission");
            return;
        }

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
    }

    if (!account.BuildLabel || version_compare(account.BuildLabel, "2020.03.24.20.24") > 0) {
        res.json({ IsLongMOTD, MOTD });
    } else {
        res.send(MOTD).end();
    }
};
