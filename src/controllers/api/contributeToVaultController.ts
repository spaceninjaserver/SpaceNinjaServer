import type { TGuildDatabaseDocument, TGuildMemberDatabaseDocument } from "../../models/guildModel.ts";
import { Alliance, Guild, GuildMember } from "../../models/guildModel.ts";
import {
    addGuildMemberMiscItemContribution,
    addGuildMemberShipDecoContribution,
    addVaultFusionTreasures,
    addVaultMiscItems,
    addVaultShipDecos,
    getGuildForRequestEx
} from "../../services/guildService.ts";
import {
    addFusionTreasures,
    addMiscItems,
    addShipDecorations,
    getInventory,
    updateCurrency
} from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { ITypeCount } from "../../types/commonTypes.ts";
import type { IFusionTreasure, IMiscItem } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";

export const contributeToVaultController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId RegularCredits MiscItems ShipDecorations FusionTreasures");
    const request = JSON.parse(String(req.body)) as IContributeToVaultRequest;

    if (request.Alliance) {
        const guild = await getGuildForRequestEx(req, inventory);
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

    let guild: TGuildDatabaseDocument;
    let guildMember: TGuildMemberDatabaseDocument | undefined;
    if (request.GuildVault) {
        guild = (await Guild.findById(request.GuildVault))!;
    } else {
        guild = await getGuildForRequestEx(req, inventory);
        guildMember = (await GuildMember.findOne(
            { accountId, guildId: guild._id },
            "RegularCreditsContributed MiscItemsContributed ShipDecorationsContributed"
        ))!;
    }

    if (request.RegularCredits) {
        updateCurrency(inventory, request.RegularCredits, false);

        guild.VaultRegularCredits ??= 0;
        guild.VaultRegularCredits += request.RegularCredits;

        if (guildMember) {
            guildMember.RegularCreditsContributed ??= 0;
            guildMember.RegularCreditsContributed += request.RegularCredits;
        }
    }
    if (request.MiscItems.length) {
        addVaultMiscItems(guild, request.MiscItems);
        for (const item of request.MiscItems) {
            if (guildMember) {
                addGuildMemberMiscItemContribution(guildMember, item);
            }
            addMiscItems(inventory, [{ ...item, ItemCount: item.ItemCount * -1 }]);
        }
    }
    if (request.ShipDecorations.length) {
        addVaultShipDecos(guild, request.ShipDecorations);
        for (const item of request.ShipDecorations) {
            if (guildMember) {
                addGuildMemberShipDecoContribution(guildMember, item);
            }
            addShipDecorations(inventory, [{ ...item, ItemCount: item.ItemCount * -1 }]);
        }
    }
    if (request.FusionTreasures.length) {
        addVaultFusionTreasures(guild, request.FusionTreasures);
        for (const item of request.FusionTreasures) {
            addFusionTreasures(inventory, [{ ...item, ItemCount: item.ItemCount * -1 }]);
        }
    }

    const promises: Promise<unknown>[] = [guild.save(), inventory.save()];
    if (guildMember) {
        promises.push(guildMember.save());
    }
    await Promise.all(promises);

    res.end();
};

interface IContributeToVaultRequest {
    RegularCredits: number;
    MiscItems: IMiscItem[];
    ShipDecorations: ITypeCount[];
    FusionTreasures: IFusionTreasure[];
    Alliance?: boolean;
    FromVault?: boolean;
    GuildVault?: string;
}
