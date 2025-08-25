import { getJSONfromString, regexEscape } from "../../helpers/stringHelpers.ts";
import { Alliance, AllianceMember, Guild, GuildMember } from "../../models/guildModel.ts";
import { createMessage } from "../../services/inboxService.ts";
import { getEffectiveAvatarImageType, getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, getSuffixedName } from "../../services/loginService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import { logger } from "../../utils/logger.ts";
import type { RequestHandler } from "express";
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
    const alliance = (await Alliance.findById(req.query.allianceId as string, "Name"))!;
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
            icon: ExportFlavour[getEffectiveAvatarImageType(senderInventory)].icon,
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
