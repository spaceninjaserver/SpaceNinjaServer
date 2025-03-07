import { getGuildForRequestEx } from "@/src/services/guildService";
import { addFusionTreasures, addMiscItems, addShipDecorations, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IFusionTreasure, IMiscItem, ITypeCount } from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";

export const contributeToVaultController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const guild = await getGuildForRequestEx(req, inventory);
    const request = JSON.parse(String(req.body)) as IContributeToVaultRequest;

    if (request.RegularCredits) {
        guild.VaultRegularCredits ??= 0;
        guild.VaultRegularCredits += request.RegularCredits;
    }
    if (request.MiscItems.length) {
        guild.VaultMiscItems ??= [];
        for (const item of request.MiscItems) {
            guild.VaultMiscItems.push(item);
            addMiscItems(inventory, [{ ...item, ItemCount: item.ItemCount * -1 }]);
        }
    }
    if (request.ShipDecorations.length) {
        guild.VaultShipDecorations ??= [];
        for (const item of request.ShipDecorations) {
            guild.VaultShipDecorations.push(item);
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

    await guild.save();
    await inventory.save();
    res.end();
};

interface IContributeToVaultRequest {
    RegularCredits: number;
    MiscItems: IMiscItem[];
    ShipDecorations: ITypeCount[];
    FusionTreasures: IFusionTreasure[];
}
