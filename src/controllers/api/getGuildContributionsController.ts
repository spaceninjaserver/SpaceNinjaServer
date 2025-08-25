import { GuildMember } from "../../models/guildModel.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IGuildMemberClient } from "../../types/guildTypes.ts";
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
