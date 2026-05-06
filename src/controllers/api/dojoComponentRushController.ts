import type { TGuildDatabaseDocument } from "../../models/guildModel.ts";
import { GuildMember } from "../../models/guildModel.ts";
import {
    getDojoClient,
    getGuildForRequestEx,
    hasAccessToDojo,
    scaleRequiredCount
} from "../../services/guildService.ts";
import { getInventory2, updatePlatinum } from "../../services/inventoryService.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import type { IDojoContributable } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";
import type { IDojoBuild } from "warframe-public-export-plus";
import { ExportDojoRecipes } from "warframe-public-export-plus";

type IDojoComponentRushRequest =
    | {
          DecoType?: string;
          DecoId?: string;
          ComponentId: string;
          Amount: number;
          VaultAmount: number;
          AllianceVaultAmount: number;
      }
    | {
          decoId?: string;
          componentId: string;
          amount: number;
          vaultAmount: number;
      };

export const dojoComponentRushController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory2(
        account._id,
        "LevelKeys",
        "GuildId",
        "infinitePlatinum",
        "PremiumCredits",
        "PremiumCreditsFree"
    );
    if (!hasAccessToDojo(inventory)) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }
    const guild = await getGuildForRequestEx(req, inventory);
    const request = JSON.parse(String(req.body)) as IDojoComponentRushRequest;
    const component = guild.DojoComponents.id("ComponentId" in request ? request.ComponentId : request.componentId)!;

    const amount = "Amount" in request ? request.Amount : request.amount;
    let platinumDonated = amount;
    const inventoryChanges = updatePlatinum(inventory, amount);

    const vaultAmount = "VaultAmount" in request ? request.VaultAmount : request.vaultAmount;
    if (vaultAmount) {
        platinumDonated += vaultAmount;
        guild.VaultPremiumCredits! -= vaultAmount;
    }

    const decoId = "DecoId" in request ? request.DecoId : "decoId" in request ? request.decoId : undefined;
    if (decoId) {
        const deco = component.Decos!.find(x => x._id.equals(decoId))!;
        const meta = Object.values(ExportDojoRecipes.decos).find(x => x.resultType == deco.Type)!;
        processContribution(guild, deco, meta, platinumDonated);
    } else {
        const meta = Object.values(ExportDojoRecipes.rooms).find(x => x.resultType == component.pf)!;
        processContribution(guild, component, meta, platinumDonated);

        const entry = guild.RoomChanges?.find(x => x.componentId.equals(component._id));
        if (entry) {
            entry.dateTime = component.CompletionTime!;
        }
    }

    const guildMember = (await GuildMember.findOne(
        { accountId: account._id, guildId: guild._id },
        "PremiumCreditsContributed"
    ))!;
    guildMember.PremiumCreditsContributed ??= 0;
    guildMember.PremiumCreditsContributed += amount;

    await Promise.all([guild.save(), inventory.save(), guildMember.save()]);

    res.json({
        ...(await getDojoClient(guild, 0, component._id, account.BuildLabel)),
        InventoryChanges: inventoryChanges
    });
};

const processContribution = (
    guild: TGuildDatabaseDocument,
    component: IDojoContributable,
    meta: IDojoBuild,
    platinumDonated: number
): void => {
    const fullPlatinumCost = scaleRequiredCount(guild.Tier, meta.skipTimePrice);
    const fullDurationSeconds = meta.time;
    const secondsPerPlatinum = fullDurationSeconds / fullPlatinumCost;
    component.CompletionTime = new Date(
        component.CompletionTime!.getTime() - secondsPerPlatinum * platinumDonated * 1000
    );
    component.RushPlatinum ??= 0;
    component.RushPlatinum += platinumDonated;
};
