import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const setEvolutionProgressController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const payload = req.body as ISetEvolutionProgressRequest;

    inventory.EvolutionProgress ??= [];
    payload.forEach(element => {
        const entry = inventory.EvolutionProgress!.find(entry => entry.ItemType === element.ItemType);

        if (entry) {
            entry.Progress = 0;
            entry.Rank = element.Rank;
        } else {
            inventory.EvolutionProgress!.push({
                Progress: 0,
                Rank: element.Rank,
                ItemType: element.ItemType
            });
        }
    });

    await inventory.save();
    res.end();
    broadcastInventoryUpdate(req);
};

type ISetEvolutionProgressRequest = {
    ItemType: string;
    Rank: number;
}[];
