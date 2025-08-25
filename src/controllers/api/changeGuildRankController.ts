import { GuildMember } from "@/src/models/guildModel";
import { getGuildForRequest, hasGuildPermissionEx } from "@/src/services/guildService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
import type { RequestHandler } from "express";

export const changeGuildRankController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const member = (await GuildMember.findOne({
        accountId: accountId,
        guildId: req.query.guildId as string
    }))!;
    const newRank: number = parseInt(req.query.rankChange as string);

    const guild = await getGuildForRequest(req);
    if (newRank < member.rank || !hasGuildPermissionEx(guild, member, GuildPermission.Promoter)) {
        res.status(400).json("Invalid permission");
        return;
    }

    const target = (await GuildMember.findOne({
        guildId: req.query.guildId as string,
        accountId: req.query.targetId as string
    }))!;
    target.rank = parseInt(req.query.rankChange as string);
    await target.save();

    if (newRank == 0) {
        // If we just promoted someone else to Founding Warlord, we need to demote ourselves to Warlord.
        member.rank = 1;
        await member.save();
    }

    res.json({
        _id: req.query.targetId as string,
        Rank: newRank
    });
};
