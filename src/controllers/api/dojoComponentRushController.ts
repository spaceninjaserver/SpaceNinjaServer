import { getDojoClient, getGuildForRequestEx, scaleRequiredCount } from "@/src/services/guildService";
import { getInventory, updateCurrency } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";
import { ExportDojoRecipes } from "warframe-public-export-plus";

export const dojoComponentRushController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const guild = await getGuildForRequestEx(req, inventory);
    const request = JSON.parse(String(req.body)) as IDojoComponentRushRequest;
    const component = guild.DojoComponents.id(request.ComponentId)!;
    const componentMeta = Object.values(ExportDojoRecipes.rooms).find(x => x.resultType == component.pf)!;

    const fullPlatinumCost = scaleRequiredCount(componentMeta.skipTimePrice);
    const fullDurationSeconds = componentMeta.time;
    const secondsPerPlatinum = fullDurationSeconds / fullPlatinumCost;
    component.CompletionTime = new Date(
        component.CompletionTime!.getTime() - secondsPerPlatinum * request.Amount * 1000
    );
    const inventoryChanges = updateCurrency(inventory, request.Amount, true);

    await guild.save();
    await inventory.save();
    res.json({
        ...getDojoClient(guild, 0, component._id),
        InventoryChanges: inventoryChanges
    });
};

interface IDojoComponentRushRequest {
    ComponentId: string;
    Amount: number;
    VaultAmount: number;
    AllianceVaultAmount: number;
}
