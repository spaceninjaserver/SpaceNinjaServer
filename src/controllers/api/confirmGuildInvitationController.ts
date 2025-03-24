import { Guild, GuildMember } from "@/src/models/guildModel";
import { getGuildClient, updateInventoryForConfirmedGuildJoin } from "@/src/services/guildService";
import { getAccountForRequest, getSuffixedName } from "@/src/services/loginService";
import { RequestHandler } from "express";
import { Types } from "mongoose";

export const confirmGuildInvitationController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const guildMember = await GuildMember.findOne({
        accountId: account._id,
        guildId: req.query.clanId as string
    });
    if (guildMember) {
        guildMember.status = 0;
        await guildMember.save();

        await updateInventoryForConfirmedGuildJoin(
            account._id.toString(),
            new Types.ObjectId(req.query.clanId as string)
        );

        const guild = (await Guild.findById(req.query.clanId as string))!;

        guild.RosterActivity ??= [];
        guild.RosterActivity.push({
            dateTime: new Date(),
            entryType: 6,
            details: getSuffixedName(account)
        });
        await guild.save();

        res.json({
            ...(await getGuildClient(guild, account._id.toString())),
            InventoryChanges: {
                Recipes: [
                    {
                        ItemType: "/Lotus/Types/Keys/DojoKeyBlueprint",
                        ItemCount: 1
                    }
                ]
            }
        });
    } else {
        res.end();
    }
};
