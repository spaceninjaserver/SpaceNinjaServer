import { version_compare } from "../../helpers/inventoryHelpers.ts";
import { Alliance, Guild, GuildMember } from "../../models/guildModel.ts";
import { hasGuildPermissionEx } from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, getBuildLabel, getSuffixedName } from "../../services/loginService.ts";
import type { ILongMOTD } from "../../types/guildTypes.ts";
import { eGuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";

export const setGuildMotdController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id, "GuildId");
    const guild = (await Guild.findById(inventory.GuildId!))!;
    const member = (await GuildMember.findOne({ accountId: account._id, guildId: guild._id }))!;

    const IsLongMOTD = "longMOTD" in req.query;
    let MOTD = req.body ? String(req.body) : undefined;
    if (MOTD && MOTD.charCodeAt(MOTD.length - 1) === 0) {
        // U10's request body ends on a zero byte, but that's not intended to be part of the MOTD.
        MOTD = MOTD.substring(0, MOTD.length - 1);
    }

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
        if (!hasGuildPermissionEx(guild, member, eGuildPermission.Herald)) {
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

    const buildLabel = getBuildLabel(req, account);
    if (version_compare(buildLabel, gameToBuildVersion["29.3.1"]) > 0) {
        res.json({ IsLongMOTD, MOTD });
    } else {
        res.send(MOTD).end();
    }
};
