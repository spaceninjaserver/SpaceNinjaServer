import { GuildMember, type TGuildDatabaseDocument } from "../../models/guildModel.ts";
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
import {
    getAccountForRequest,
    getSuffixedName,
    getUnicodeName,
    type TAccountDocument
} from "../../services/loginService.ts";
import { broadcastGuildUpdate, sendWsBroadcastToWebui } from "../../services/wsService.ts";
import { eGuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler, Response } from "express";

export const removeFromGuildGetController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const guild = await getGuildForRequest(req, account._id);
    const userName = req.query.userName as string;
    await processRemoveFromGuildRequest(account, guild, { userName }, res);
    broadcastGuildUpdate(req, guild._id.toString());
};

export const removeFromGuildPostController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const guild = await getGuildForRequest(req, account._id);
    const payload = JSON.parse(String(req.body)) as IRemoveFromGuildRequest;
    await processRemoveFromGuildRequest(account, guild, payload, res);
    broadcastGuildUpdate(req, guild._id.toString());
};

const processRemoveFromGuildRequest = async (
    account: TAccountDocument,
    guild: TGuildDatabaseDocument,
    payload: IRemoveFromGuildRequest,
    res: Response
): Promise<void> => {
    if (!payload.userId) {
        const oid = (await Account.findOne({ DisplayName: payload.userName }, "_id"))?._id;
        payload.userId = oid?.toString();
        if (!payload.userId) {
            throw new Error(`invalid removeFromGuild request: ${JSON.stringify(payload)}`);
        }
    }
    const isKick = !account._id.equals(payload.userId);
    if (isKick && !(await hasGuildPermission(guild, account._id, eGuildPermission.Regulator))) {
        res.status(400).json("Invalid permission");
        return;
    }

    const accountOfRemovedMember = isKick ? (await Account.findById(payload.userId))! : account;

    const guildMember = await GuildMember.findOne({ accountId: payload.userId, guildId: guild._id });
    if (guildMember) {
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
                guild.RosterActivity.push({
                    dateTime: new Date(),
                    entryType: 12,
                    details: getSuffixedName(accountOfRemovedMember) + "," + getSuffixedName(account)
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
    }

    res.json({
        _id: payload.userId,
        Name: getUnicodeName(accountOfRemovedMember, account.BuildLabel), // U40+ needs this to send social notify over IRC
        ItemToRemove: "/Lotus/Types/Keys/DojoKey",
        RecipeToRemove: "/Lotus/Types/Keys/DojoKeyBlueprint"
    });
    sendWsBroadcastToWebui({ update_guild: true }, payload.userId);
};

interface IRemoveFromGuildRequest {
    userId?: string;
    userName?: string; // U22.13.4 provides this instead of userId
    kicker?: string;
}
