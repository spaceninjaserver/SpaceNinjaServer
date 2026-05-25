import type { TGuildDatabaseDocument } from "../../models/guildModel.ts";
import { GuildMember } from "../../models/guildModel.ts";
import {
    getDojoClient,
    getGuildForRequestEx,
    hasAccessToDojo,
    scaleRequiredCount
} from "../../services/guildService.ts";
import { getInventory2, updatePlatinum } from "../../services/inventoryService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import type { IDojoContributable } from "../../types/guildTypes.ts";
import type { RequestHandler, Request, Response } from "express";
import type { IDojoBuild } from "warframe-public-export-plus";
import { ExportDojoRecipes } from "warframe-public-export-plus";

export const dojoComponentRushGetController: RequestHandler = (req, res) => {
    return processDojoComponentRush(
        req,
        res,
        req.query.componentId as string,
        req.query.decoId as string | undefined,
        parseInt(req.query.contributionAmount as string),
        parseInt(req.query.vaultContributionAmount as string)
    );
};

type IDojoComponentRushPostRequest =
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

export const dojoComponentRushPostController: RequestHandler = (req, res) => {
    const request = JSON.parse(String(req.body)) as IDojoComponentRushPostRequest;
    return "ComponentId" in request
        ? processDojoComponentRush(req, res, request.ComponentId, request.DecoId, request.Amount, request.VaultAmount)
        : processDojoComponentRush(req, res, request.componentId, request.decoId, request.amount, request.vaultAmount);
};

// TODO: Contributions from alliance vault?
const processDojoComponentRush = async (
    req: Request,
    res: Response,
    componentId: string,
    decoId: string | undefined,
    amount: number,
    vaultAmount: number
): Promise<void> => {
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
    const component = guild.DojoComponents.id(componentId)!;

    let platinumDonated = amount;
    const inventoryChanges = updatePlatinum(inventory, amount);

    if (vaultAmount) {
        platinumDonated += vaultAmount;
        guild.VaultPremiumCredits! -= vaultAmount;
    }

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

    const buildLabel = getBuildLabel(req, account);
    res.json({
        ...(await getDojoClient(guild, 0, component._id, buildLabel)),
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
