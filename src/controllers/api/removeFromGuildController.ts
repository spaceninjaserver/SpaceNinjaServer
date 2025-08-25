import { GuildMember } from "../../models/guildModel.ts";
import { Inbox } from "../../models/inboxModel.ts";
import { Account } from "../../models/loginModel.ts";
import {
    deleteGuild,
    getGuildForRequest,
    hasGuildPermission,
    removeDojoKeyItems
} from "../../services/guildService.ts";
import { createMessage } from "../../services/inboxService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, getSuffixedName } from "../../services/loginService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";

export const removeFromGuildController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const guild = await getGuildForRequest(req);
    const payload = JSON.parse(String(req.body)) as IRemoveFromGuildRequest;
    const isKick = !account._id.equals(payload.userId);
    if (isKick && !(await hasGuildPermission(guild, account._id, GuildPermission.Regulator))) {
        res.status(400).json("Invalid permission");
        return;
    }

    const guildMember = (await GuildMember.findOne({ accountId: payload.userId, guildId: guild._id }))!;
    if (guildMember.rank == 0) {
        await deleteGuild(guild._id);
    } else {
        if (guildMember.status == 0) {
            const inventory = await getInventory(payload.userId, "GuildId LevelKeys Recipes");
            inventory.GuildId = undefined;
            removeDojoKeyItems(inventory);
            await inventory.save();
        } else if (guildMember.status == 1) {
            // TOVERIFY: Is this inbox message actually sent on live?
            await createMessage(guildMember.accountId, [
                {
                    sndr: "/Lotus/Language/Bosses/Ordis",
                    msg: "/Lotus/Language/Clan/RejectedFromClan",
                    sub: "/Lotus/Language/Clan/RejectedFromClanHeader",
                    arg: [
                        {
                            Key: "PLAYER_NAME",
                            Tag: (await Account.findOne({ _id: guildMember.accountId }, "DisplayName"))!.DisplayName
                        },
                        {
                            Key: "CLAN_NAME",
                            Tag: guild.Name
                        }
                    ]
                    // TOVERIFY: If this message is sent on live, is it highPriority?
                }
            ]);
        } else if (guildMember.status == 2) {
            // Delete the inbox message for the invite
            await Inbox.deleteOne({
                ownerId: guildMember.accountId,
                contextInfo: guild._id.toString(),
                acceptAction: "GUILD_INVITE"
            });
        }
        await GuildMember.deleteOne({ _id: guildMember._id });

        guild.RosterActivity ??= [];
        if (isKick) {
            const kickee = (await Account.findById(payload.userId))!;
            guild.RosterActivity.push({
                dateTime: new Date(),
                entryType: 12,
                details: getSuffixedName(kickee) + "," + getSuffixedName(account)
            });
        } else {
            guild.RosterActivity.push({
                dateTime: new Date(),
                entryType: 7,
                details: getSuffixedName(account)
            });
        }
        await guild.save();
    }

    res.json({
        _id: payload.userId,
        ItemToRemove: "/Lotus/Types/Keys/DojoKey",
        RecipeToRemove: "/Lotus/Types/Keys/DojoKeyBlueprint"
    });
};

interface IRemoveFromGuildRequest {
    userId: string;
    kicker?: string;
}
