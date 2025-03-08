import { getDojoClient, getGuildForRequestEx, scaleRequiredCount } from "@/src/services/guildService";
import { getInventory, updateCurrency } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IDojoContributable } from "@/src/types/guildTypes";
import { RequestHandler } from "express";
import { ExportDojoRecipes, IDojoBuild } from "warframe-public-export-plus";

interface IDojoComponentRushRequest {
    DecoType?: string;
    DecoId?: string;
    ComponentId: string;
    Amount: number;
    VaultAmount: number;
    AllianceVaultAmount: number;
}

export const dojoComponentRushController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const guild = await getGuildForRequestEx(req, inventory);
    const request = JSON.parse(String(req.body)) as IDojoComponentRushRequest;
    const component = guild.DojoComponents.id(request.ComponentId)!;

    if (request.DecoId) {
        const deco = component.Decos!.find(x => x._id.equals(request.DecoId))!;
        const meta = Object.values(ExportDojoRecipes.decos).find(x => x.resultType == deco.Type)!;
        processContribution(deco, meta, request.Amount);
    } else {
        const meta = Object.values(ExportDojoRecipes.rooms).find(x => x.resultType == component.pf)!;
        processContribution(component, meta, request.Amount);
    }

    const inventoryChanges = updateCurrency(inventory, request.Amount, true);

    await guild.save();
    await inventory.save();
    res.json({
        ...(await getDojoClient(guild, 0, component._id)),
        InventoryChanges: inventoryChanges
    });
};

const processContribution = (component: IDojoContributable, meta: IDojoBuild, platinumDonated: number): void => {
    const fullPlatinumCost = scaleRequiredCount(meta.skipTimePrice);
    const fullDurationSeconds = meta.time;
    const secondsPerPlatinum = fullDurationSeconds / fullPlatinumCost;
    component.CompletionTime = new Date(
        component.CompletionTime!.getTime() - secondsPerPlatinum * platinumDonated * 1000
    );
    component.RushPlatinum ??= 0;
    component.RushPlatinum += platinumDonated;
};
