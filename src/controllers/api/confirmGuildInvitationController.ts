import { Guild, GuildMember } from "@/src/models/guildModel";
import { getGuildClient, updateInventoryForConfirmedGuildJoin } from "@/src/services/guildService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";
import { Types } from "mongoose";

export const confirmGuildInvitationController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const guildMember = await GuildMember.findOne({
        accountId: accountId,
        guildId: req.query.clanId as string
    });
    if (guildMember) {
        guildMember.status = 0;
        await guildMember.save();
        await updateInventoryForConfirmedGuildJoin(accountId, new Types.ObjectId(req.query.clanId as string));
        const guild = (await Guild.findOne({ _id: req.query.clanId as string }))!;
        res.json({
            ...(await getGuildClient(guild, accountId)),
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
