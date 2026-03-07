import { toMongoDate2 } from "../../helpers/inventoryHelpers.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Guild } from "../../models/guildModel.ts";
import { checkClanAscensionHasRequiredContributors } from "../../services/guildService.ts";
import { addFusionPoints, getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const contributeGuildClassController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const payload = getJSONfromString<IContributeGuildClassRequest>(String(req.body));
    const guild = (await Guild.findById(payload.GuildId))!;

    // First contributor initiates ceremony and locks the pending class.
    if (!guild.CeremonyContributors) {
        guild.CeremonyContributors = [];
        guild.CeremonyClass = guildXpToClass(guild.XP);
        guild.CeremonyEndo = 0;
        for (let i = guild.Class; i != guild.CeremonyClass; ++i) {
            guild.CeremonyEndo += (i + 1) * 1000;
        }
        guild.ClassChanges ??= [];
        guild.ClassChanges.push({
            dateTime: new Date(),
            entryType: 13,
            details: guild.CeremonyClass
        });
    }

    guild.CeremonyContributors.push(account._id);

    await checkClanAscensionHasRequiredContributors(guild);

    await guild.save();

    // Either way, endo is given to the contributor.
    const inventory = await getInventory(account._id, "FusionPoints");
    addFusionPoints(inventory, guild.CeremonyEndo!);
    await inventory.save();

    res.json({
        NumContributors: guild.CeremonyContributors.length,
        FusionPointReward: guild.CeremonyEndo,
        Class: guild.Class,
        CeremonyResetDate: guild.CeremonyResetDate
            ? toMongoDate2(guild.CeremonyResetDate, account.BuildLabel)
            : undefined
    });
};

interface IContributeGuildClassRequest {
    GuildId: string;
    RequiredContributors: number;
}

const guildXpToClass = (xp: number): number => {
    const cummXp = [
        0, 11000, 34000, 69000, 114000, 168000, 231000, 302000, 381000, 68000, 563000, 665000, 774000, 891000
    ];
    let highest = 0;
    for (let i = 0; i != cummXp.length; ++i) {
        if (xp < cummXp[i]) {
            break;
        }
        highest = i;
    }
    return highest;
};
