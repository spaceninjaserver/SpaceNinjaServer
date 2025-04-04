import { getJSONfromString, regexEscape } from "@/src/helpers/stringHelpers";
import { Alliance, AllianceMember, Guild, GuildMember } from "@/src/models/guildModel";
import { createMessage } from "@/src/services/inboxService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountForRequest, getSuffixedName } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";
import { ExportFlavour } from "warframe-public-export-plus";

export const addToAllianceController: RequestHandler = async (req, res) => {
    // Check requester is a warlord in their guild
    const account = await getAccountForRequest(req);
    const guildMember = (await GuildMember.findOne({ accountId: account._id, status: 0 }))!;
    if (guildMember.rank > 1) {
        res.status(400).json({ Error: 104 });
        return;
    }

    // Check guild has invite permissions in the alliance
    const allianceMember = (await AllianceMember.findOne({
        allianceId: req.query.allianceId,
        guildId: guildMember.guildId
    }))!;
    if (!(allianceMember.Permissions & GuildPermission.Recruiter)) {
        res.status(400).json({ Error: 104 });
        return;
    }

    // Find clan to invite
    const payload = getJSONfromString<IAddToAllianceRequest>(String(req.body));
    const guilds = await Guild.find(
        {
            Name:
                payload.clanName.indexOf("#") == -1
                    ? new RegExp("^" + regexEscape(payload.clanName) + "#...$")
                    : payload.clanName
        },
        "Name"
    );
    if (guilds.length == 0) {
        res.status(400).json({ Error: 101 });
        return;
    }
    if (guilds.length > 1) {
        const choices: IGuildChoice[] = [];
        for (const guild of guilds) {
            choices.push({
                OriginalPlatform: 0,
                Name: guild.Name
            });
        }
        res.json(choices);
        return;
    }

    // Add clan as a pending alliance member
    try {
        await AllianceMember.insertOne({
            allianceId: req.query.allianceId,
            guildId: guilds[0]._id,
            Pending: true,
            Permissions: 0
        });
    } catch (e) {
        logger.debug(`alliance invite failed due to ${String(e)}`);
        res.status(400).json({ Error: 102 });
        return;
    }

    // Send inbox message to founding warlord
    // TOVERIFY: Should other warlords get this as well?
    // TOVERIFY: Who/what should the sender be?
    // TOVERIFY: Should this message be highPriority?
    const invitedClanOwnerMember = (await GuildMember.findOne({ guildId: guilds[0]._id, rank: 0 }))!;
    const senderInventory = await getInventory(account._id.toString(), "ActiveAvatarImageType");
    const senderGuild = (await Guild.findById(allianceMember.guildId, "Name"))!;
    const alliance = (await Alliance.findById(req.query.allianceId, "Name"))!;
    await createMessage(invitedClanOwnerMember.accountId, [
        {
            sndr: getSuffixedName(account),
            msg: "/Lotus/Language/Menu/Mailbox_AllianceInvite_Body",
            arg: [
                {
                    Key: "THEIR_CLAN",
                    Tag: senderGuild.Name
                },
                {
                    Key: "CLAN",
                    Tag: guilds[0].Name
                },
                {
                    Key: "ALLIANCE",
                    Tag: alliance.Name
                }
            ],
            sub: "/Lotus/Language/Menu/Mailbox_AllianceInvite_Title",
            icon: ExportFlavour[senderInventory.ActiveAvatarImageType].icon,
            contextInfo: alliance._id.toString(),
            highPriority: true,
            acceptAction: "ALLIANCE_INVITE",
            declineAction: "ALLIANCE_INVITE",
            hasAccountAction: true
        }
    ]);

    res.end();
};

interface IAddToAllianceRequest {
    clanName: string;
}

interface IGuildChoice {
    OriginalPlatform: number;
    Name: string;
}
