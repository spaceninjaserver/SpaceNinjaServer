import { Guild, GuildMember } from "@/src/models/guildModel";
import { Account } from "@/src/models/loginModel";
import { fillInInventoryDataForGuildMember, hasGuildPermission } from "@/src/services/guildService";
import { createMessage } from "@/src/services/inboxService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountForRequest, getSuffixedName } from "@/src/services/loginService";
import { IOid } from "@/src/types/commonTypes";
import { GuildPermission, IGuildMemberClient } from "@/src/types/guildTypes";
import { RequestHandler } from "express";
import { ExportFlavour } from "warframe-public-export-plus";

export const addToGuildController: RequestHandler = async (req, res) => {
    const payload = JSON.parse(String(req.body)) as IAddToGuildRequest;

    const account = await Account.findOne({ DisplayName: payload.UserName });
    if (!account) {
        res.status(400).json("Username does not exist");
        return;
    }

    const inventory = await getInventory(account._id.toString(), "Settings");
    // TODO: Also consider GIFT_MODE_FRIENDS once friends are implemented
    if (inventory.Settings?.GuildInvRestriction == "GIFT_MODE_NONE") {
        res.status(400).json("Invite restricted");
        return;
    }

    const guild = (await Guild.findById(payload.GuildId.$oid, "Name"))!;
    const senderAccount = await getAccountForRequest(req);
    if (!(await hasGuildPermission(guild, senderAccount._id.toString(), GuildPermission.Recruiter))) {
        res.status(400).json("Invalid permission");
    }

    if (
        await GuildMember.exists({
            accountId: account._id,
            guildId: payload.GuildId.$oid
        })
    ) {
        res.status(400).json("User already invited to clan");
        return;
    }

    await GuildMember.insertOne({
        accountId: account._id,
        guildId: payload.GuildId.$oid,
        status: 2 // outgoing invite
    });

    const senderInventory = await getInventory(senderAccount._id.toString(), "ActiveAvatarImageType");
    await createMessage(account._id.toString(), [
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
    await fillInInventoryDataForGuildMember(member);
    res.json({ NewMember: member });
};

interface IAddToGuildRequest {
    UserName: string;
    GuildId: IOid;
}
