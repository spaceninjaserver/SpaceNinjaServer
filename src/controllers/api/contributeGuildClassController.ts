import { toMongoDate } from "@/src/helpers/inventoryHelpers";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Guild } from "@/src/models/guildModel";
import { checkClanAscensionHasRequiredContributors } from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";
import { Types } from "mongoose";

export const contributeGuildClassController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
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

    guild.CeremonyContributors.push(new Types.ObjectId(accountId));

    await checkClanAscensionHasRequiredContributors(guild);

    await guild.save();

    // Either way, endo is given to the contributor.
    const inventory = await getInventory(accountId, "FusionPoints");
    inventory.FusionPoints += guild.CeremonyEndo!;
    await inventory.save();

    res.json({
        NumContributors: guild.CeremonyContributors.length,
        FusionPointReward: guild.CeremonyEndo,
        Class: guild.Class,
        CeremonyResetDate: guild.CeremonyResetDate ? toMongoDate(guild.CeremonyResetDate) : undefined
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
