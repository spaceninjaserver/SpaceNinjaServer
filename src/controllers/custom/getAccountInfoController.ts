import { AllianceMember, Guild, GuildMember } from "../../models/guildModel.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, isAdministrator } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const getAccountInfoController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req, true);
    const inventory = await getInventory(account._id.toString(), "QuestKeys");
    const info: IAccountInfo = {
        DisplayName: account.DisplayName,
        IsAdministrator: isAdministrator(account),
        CompletedVorsPrize: !!inventory.QuestKeys.find(
            x => x.ItemType == "/Lotus/Types/Keys/VorsPrize/VorsPrizeQuestKeyChain"
        )?.Completed
    };
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
    IsAdministrator: boolean;
    CompletedVorsPrize: boolean;
    GuildId?: string;
    GuildPermissions?: number;
    GuildRank?: number;
    AllianceId?: string;
    AlliancePermissions?: number;
}
