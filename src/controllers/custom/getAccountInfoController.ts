import { AllianceMember, Guild, GuildMember } from "@/src/models/guildModel";
import { getAccountForRequest, isAdministrator } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const getAccountInfoController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const info: IAccountInfo = {
        DisplayName: account.DisplayName
    };
    if (isAdministrator(account)) {
        info.IsAdministrator = true;
    }
    const guildMember = await GuildMember.findOne({ accountId: account._id, status: 0 }, "guildId rank");
    if (guildMember) {
        const guild = (await Guild.findById(guildMember.guildId, "Ranks AllianceId"))!;
        info.GuildId = guildMember.guildId.toString();
        info.GuildPermissions = guild.Ranks[guildMember.rank].Permissions;
        info.GuildRank = guildMember.rank;
        if (guild.AllianceId) {
            //const alliance = (await Alliance.findById(guild.AllianceId))!;
            const allianceMember = (await AllianceMember.findOne({
                allianceId: guild.AllianceId,
                guildId: guild._id
            }))!;
            info.AllianceId = guild.AllianceId.toString();
            info.AlliancePermissions = allianceMember.Permissions;
        }
    }
    res.json(info);
};

interface IAccountInfo {
    DisplayName: string;
    IsAdministrator?: boolean;
    GuildId?: string;
    GuildPermissions?: number;
    GuildRank?: number;
    AllianceId?: string;
    AlliancePermissions?: number;
}
