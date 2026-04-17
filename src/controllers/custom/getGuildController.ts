import type { RequestHandler } from "express";
import { Guild, GuildMember } from "../../models/guildModel.ts";
import { toMongoDate, toOid2 } from "../../helpers/inventoryHelpers.ts";
import { addAccountDataToFriendInfo, addInventoryDataToFriendInfo } from "../../services/friendService.ts";
import type { IGuildMemberClient } from "../../types/guildTypes.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";

export const getGuildController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId");
    if (inventory.GuildId) {
        const guild = await Guild.findById(inventory.GuildId);
        if (!guild) {
            throw new Error("Account is in a guild that doesn't exist (anymore)");
        }
        const guildMembers = await GuildMember.find({ guildId: guild._id });

        const members: IGuildMemberClient[] = [];
        const dataFillInPromises: Promise<void>[] = [];
        for (const guildMember of guildMembers) {
            const member: IGuildMemberClient = {
                _id: toOid2(guildMember.accountId, undefined),
                Rank: guildMember.rank,
                Status: guildMember.status,
                Note: guildMember.RequestMsg,
                RequestExpiry: guildMember.RequestExpiry ? toMongoDate(guildMember.RequestExpiry) : undefined
            };
            dataFillInPromises.push(addAccountDataToFriendInfo(member, undefined));
            dataFillInPromises.push(addInventoryDataToFriendInfo(member));

            members.push(member);
        }

        await Promise.all(dataFillInPromises);

        res.json({
            ...guild.toObject(),
            Members: members
        });
        return;
    }
    res.json(null);
};
