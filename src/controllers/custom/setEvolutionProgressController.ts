import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

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
};

type ISetEvolutionProgressRequest = {
    ItemType: string;
    Rank: number;
}[];
