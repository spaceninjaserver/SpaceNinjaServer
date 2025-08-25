import { GuildMember } from "@/src/models/guildModel";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import type { IGuildMemberClient } from "@/src/types/guildTypes";
import type { RequestHandler } from "express";

export const getGuildContributionsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const guildId = (await getInventory(accountId, "GuildId")).GuildId;
    const guildMember = (await GuildMember.findOne({ guildId, accountId: req.query.buddyId }))!;
    res.json({
        _id: { $oid: req.query.buddyId as string },
        RegularCreditsContributed: guildMember.RegularCreditsContributed,
        PremiumCreditsContributed: guildMember.PremiumCreditsContributed,
        MiscItemsContributed: guildMember.MiscItemsContributed,
        ConsumablesContributed: [], // ???
        ShipDecorationsContributed: guildMember.ShipDecorationsContributed
    } satisfies Partial<IGuildMemberClient>);
};
