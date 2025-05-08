import { Guild, GuildMember } from "@/src/models/guildModel";
import { Account } from "@/src/models/loginModel";
import { addInventoryDataToFriendInfo, areFriends } from "@/src/services/friendService";
import { hasGuildPermission } from "@/src/services/guildService";
import { createMessage } from "@/src/services/inboxService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountForRequest, getAccountIdForRequest, getSuffixedName } from "@/src/services/loginService";
import { IOid } from "@/src/types/commonTypes";
import { GuildPermission, IGuildMemberClient } from "@/src/types/guildTypes";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";
import { ExportFlavour } from "warframe-public-export-plus";

export const addToGuildController: RequestHandler = async (req, res) => {
    const payload = JSON.parse(String(req.body)) as IAddToGuildRequest;

    if ("UserName" in payload) {
        // Clan recruiter sending an invite

        const account = await Account.findOne({ DisplayName: payload.UserName });
        if (!account) {
            res.status(400).json("Username does not exist");
            return;
        }

        const senderAccount = await getAccountForRequest(req);
        const inventory = await getInventory(account._id.toString(), "Settings");
        if (
            inventory.Settings?.GuildInvRestriction == "GIFT_MODE_NONE" ||
            (inventory.Settings?.GuildInvRestriction == "GIFT_MODE_FRIENDS" &&
                !(await areFriends(account._id, senderAccount._id)))
        ) {
            res.status(400).json("Invite restricted");
            return;
        }

        const guild = (await Guild.findById(payload.GuildId.$oid, "Name Ranks"))!;
        if (!(await hasGuildPermission(guild, senderAccount._id.toString(), GuildPermission.Recruiter))) {
            res.status(400).json("Invalid permission");
        }

        try {
            await GuildMember.insertOne({
                accountId: account._id,
                guildId: payload.GuildId.$oid,
                status: 2 // outgoing invite
            });
        } catch (e) {
            logger.debug(`guild invite failed due to ${String(e)}`);
            res.status(400).json("User already invited to clan");
            return;
        }

        const senderInventory = await getInventory(senderAccount._id.toString(), "ActiveAvatarImageType");
        await createMessage(account._id, [
            {
                sndr: getSuffixedName(senderAccount),
                msg: "/Lotus/Language/Menu/Mailbox_ClanInvite_Body",
                arg: [
                    {
                        Key: "clan",
                        Tag: guild.Name
                    }
                ],
                sub: "/Lotus/Language/Menu/Mailbox_ClanInvite_Title",
                icon: ExportFlavour[senderInventory.ActiveAvatarImageType].icon,
                contextInfo: payload.GuildId.$oid,
                highPriority: true,
                acceptAction: "GUILD_INVITE",
                declineAction: "GUILD_INVITE",
                hasAccountAction: true
            }
        ]);

        const member: IGuildMemberClient = {
            _id: { $oid: account._id.toString() },
            DisplayName: account.DisplayName,
            Rank: 7,
            Status: 2
        };
        await addInventoryDataToFriendInfo(member);
        res.json({ NewMember: member });
    } else if ("RequestMsg" in payload) {
        // Player applying to join a clan
        const accountId = await getAccountIdForRequest(req);
        try {
            await GuildMember.insertOne({
                accountId,
                guildId: payload.GuildId.$oid,
                status: 1, // incoming invite
                RequestMsg: payload.RequestMsg,
                RequestExpiry: new Date(Date.now() + 14 * 86400 * 1000) // TOVERIFY: I can't find any good information about this with regards to live, but 2 weeks seem reasonable.
            });
        } catch (e) {
            logger.debug(`guild invite failed due to ${String(e)}`);
            res.status(400).send("Already requested");
        }
        res.end();
    } else {
        logger.error(`data provided to ${req.path}: ${String(req.body)}`);
        res.status(400).end();
    }
};

interface IAddToGuildRequest {
    UserName?: string;
    GuildId: IOid;
    RequestMsg?: string;
}
