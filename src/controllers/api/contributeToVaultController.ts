import { Alliance, GuildMember } from "@/src/models/guildModel";
import {
    addGuildMemberMiscItemContribution,
    addGuildMemberShipDecoContribution,
    addVaultFusionTreasures,
    addVaultMiscItems,
    addVaultShipDecos,
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
    const request = JSON.parse(String(req.body)) as IContributeToVaultRequest;

    if (request.Alliance) {
        const alliance = (await Alliance.findById(guild.AllianceId!))!;
        alliance.VaultRegularCredits ??= 0;
        alliance.VaultRegularCredits += request.RegularCredits;
        if (request.FromVault) {
            guild.VaultRegularCredits! -= request.RegularCredits;
            await Promise.all([guild.save(), alliance.save()]);
        } else {
            updateCurrency(inventory, request.RegularCredits, false);
            await Promise.all([inventory.save(), alliance.save()]);
        }
        res.end();
        return;
    }

    const guildMember = (await GuildMember.findOne(
        { accountId, guildId: guild._id },
        "RegularCreditsContributed MiscItemsContributed ShipDecorationsContributed"
    ))!;
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
        addVaultShipDecos(guild, request.ShipDecorations);
        for (const item of request.ShipDecorations) {
            addGuildMemberShipDecoContribution(guildMember, item);
            addShipDecorations(inventory, [{ ...item, ItemCount: item.ItemCount * -1 }]);
        }
    }
    if (request.FusionTreasures.length) {
        addVaultFusionTreasures(guild, request.FusionTreasures);
        for (const item of request.FusionTreasures) {
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
    Alliance?: boolean;
    FromVault?: boolean;
}
