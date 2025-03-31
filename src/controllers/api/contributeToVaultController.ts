import { GuildMember } from "@/src/models/guildModel";
import {
    addGuildMemberMiscItemContribution,
    addVaultMiscItems,
    getGuildForRequestEx
} from "@/src/services/guildService";
import {
    addFusionTreasures,
    addMiscItems,
    addShipDecorations,
    getInventory,
    updateCurrency
} from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IFusionTreasure, IMiscItem, ITypeCount } from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";

export const contributeToVaultController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId RegularCredits MiscItems ShipDecorations FusionTreasures");
    const guild = await getGuildForRequestEx(req, inventory);
    const guildMember = (await GuildMember.findOne(
        { accountId, guildId: guild._id },
        "RegularCreditsContributed MiscItemsContributed ShipDecorationsContributed"
    ))!;
    const request = JSON.parse(String(req.body)) as IContributeToVaultRequest;

    if (request.RegularCredits) {
        updateCurrency(inventory, request.RegularCredits, false);

        guild.VaultRegularCredits ??= 0;
        guild.VaultRegularCredits += request.RegularCredits;

        guildMember.RegularCreditsContributed ??= 0;
        guildMember.RegularCreditsContributed += request.RegularCredits;
    }
    if (request.MiscItems.length) {
        addVaultMiscItems(guild, request.MiscItems);

        for (const item of request.MiscItems) {
            addGuildMemberMiscItemContribution(guildMember, item);

            addMiscItems(inventory, [{ ...item, ItemCount: item.ItemCount * -1 }]);
        }
    }
    if (request.ShipDecorations.length) {
        guild.VaultShipDecorations ??= [];
        guildMember.ShipDecorationsContributed ??= [];
        for (const item of request.ShipDecorations) {
            guild.VaultShipDecorations.push(item);
            guildMember.ShipDecorationsContributed.push(item);
            addShipDecorations(inventory, [{ ...item, ItemCount: item.ItemCount * -1 }]);
        }
    }
    if (request.FusionTreasures.length) {
        guild.VaultFusionTreasures ??= [];
        for (const item of request.FusionTreasures) {
            guild.VaultFusionTreasures.push(item);
            addFusionTreasures(inventory, [{ ...item, ItemCount: item.ItemCount * -1 }]);
        }
    }

    await Promise.all([guild.save(), inventory.save(), guildMember.save()]);
    res.end();
};

interface IContributeToVaultRequest {
    RegularCredits: number;
    MiscItems: IMiscItem[];
    ShipDecorations: ITypeCount[];
    FusionTreasures: IFusionTreasure[];
}
