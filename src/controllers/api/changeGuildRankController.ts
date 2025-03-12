import { GuildMember } from "@/src/models/guildModel";
import { RequestHandler } from "express";

export const changeGuildRankController: RequestHandler = async (req, res) => {
    // TODO: Verify permissions
    const guildMember = (await GuildMember.findOne({
        guildId: req.query.guildId as string,
        accountId: req.query.targetId as string
    }))!;
    guildMember.rank = parseInt(req.query.rankChange as string);
    await guildMember.save();

    if (guildMember.rank == 0) {
        // If we just promoted someone else to Founding Warlord, we need to demote ourselves to Warlord.
        await GuildMember.findOneAndUpdate(
            {
                guildId: req.query.guildId as string,
                accountId: req.query.accountId as string
            },
            { rank: 1 }
        );
    }

    res.json({
        _id: req.query.targetId as string,
        Rank: guildMember.rank
    });
};
