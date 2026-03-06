import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";
import { GuildMember } from "../../models/guildModel.ts";
import { getGuildForRequest, getGuildRankBase, hasGuildPermissionEx } from "../../services/guildService.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";
import { logger } from "../../utils/logger.ts";

export const changeGuildRankController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const member = (await GuildMember.findOne({
        accountId: account._id,
        guildId: req.query.guildId as string
    }))!;
    const guild = await getGuildForRequest(req);
    const target = (await GuildMember.findOne({
        guildId: req.query.guildId as string,
        accountId: req.query.targetId as string
    }))!;

    // TODO: Figure out the exact version when rankChange stopped being a delta.
    const rankChange: number = parseInt(req.query.rankChange as string);
    const rankChangeIsADelta =
        account.BuildLabel && version_compare(account.BuildLabel, gameToBuildVersion["24.0.0"]) <= 0;
    const newRank: number = rankChangeIsADelta
        ? target.rank + parseInt(req.query.rankChange as string)
        : parseInt(req.query.rankChange as string);
    logger.debug(
        `treating rankChange of ${rankChange} as ${rankChangeIsADelta ? "a delta" : "an absolute value"}, so newRank = ${newRank}`
    );

    if (newRank < member.rank || !hasGuildPermissionEx(guild, member, GuildPermission.Promoter)) {
        res.status(400).json("Invalid permission");
        return;
    }

    target.rank = newRank;
    await target.save();

    if (newRank == 0) {
        // If we just promoted someone else to Founding Warlord, we need to demote ourselves to Warlord.
        member.rank = 1;
        await member.save();
    }

    res.json({
        _id: req.query.targetId as string,
        Rank: getGuildRankBase(account.BuildLabel) + newRank
    });
};
