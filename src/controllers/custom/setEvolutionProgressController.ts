import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const setEvolutionProgressController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "EvolutionProgress");
    const payload = req.body as ISetEvolutionProgressRequest[];

    inventory.EvolutionProgress ??= [];
    for (const element of payload) {
        if ("Delete" in element) {
            const index = inventory.EvolutionProgress.findIndex(entry => entry.ItemType == element.ItemType);
            if (index != -1) {
                inventory.EvolutionProgress.splice(index, 1);
            }
        } else {
            const entry = inventory.EvolutionProgress.find(entry => entry.ItemType == element.ItemType);
            if (entry) {
                entry.Progress = 0;
                entry.Rank = element.Rank;
            } else {
                inventory.EvolutionProgress.push({
                    Progress: 0,
                    Rank: element.Rank,
                    ItemType: element.ItemType
                });
            }
        }
    }

    await inventory.save();
    res.json(inventory.EvolutionProgress);
    broadcastInventoryUpdate(req);
};

type ISetEvolutionProgressRequest = { ItemType: string } & ({ Rank: number } | { Delete: true });
