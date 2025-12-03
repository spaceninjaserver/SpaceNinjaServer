import { version_compare } from "../../helpers/inventoryHelpers.ts";
import { Alliance, Guild, GuildMember } from "../../models/guildModel.ts";
import { hasGuildPermissionEx } from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, getSuffixedName } from "../../services/loginService.ts";
import type { ILongMOTD } from "../../types/guildTypes.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";
import gameToBuildVersion from "../../../static/fixed_responses/gameToBuildVersion.json" with { type: "json" };

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

    if (!account.BuildLabel || version_compare(account.BuildLabel, gameToBuildVersion["29.3.1"]) > 0) {
        res.json({ IsLongMOTD, MOTD });
    } else {
        res.send(MOTD).end();
    }
};
