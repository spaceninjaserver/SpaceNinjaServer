import type { RequestHandler } from "express";
import { hasGuildPermission } from "../../services/guildService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Alliance, Guild } from "../../models/guildModel.ts";

export const setBadlandBudgetCapsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId");
    const guild = await Guild.findById(inventory.GuildId); // this request does not have a guildId parameter :(
    if (!guild || !(await hasGuildPermission(guild, accountId, GuildPermission.Treasurer))) {
        res.status(400).send("-1").end();
        return;
    }
    const payload = getJSONfromString<ISetBadlandBudgetCapsRequest>(String(req.body));
    if (payload.Alliance) {
        const alliance = (await Alliance.findById(guild.AllianceId))!;
        alliance.MaxBattlePayReserve = payload.MaxBattlePayReserve;
        alliance.MaxMissionBattlePay = payload.MaxMissionBattlePay;
        alliance.MinMissionBattlePay = payload.MinMissionBattlePay;
        await alliance.save();
    } else {
        guild.MaxBattlePayReserve = payload.MaxBattlePayReserve;
        guild.MaxMissionBattlePay = payload.MaxMissionBattlePay;
        guild.MinMissionBattlePay = payload.MinMissionBattlePay;
        await guild.save();
    }
    res.json(payload);
};

interface ISetBadlandBudgetCapsRequest {
    MaxBattlePayReserve: number;
    MaxMissionBattlePay: number;
    MinMissionBattlePay: number;
    Alliance?: true;
}
