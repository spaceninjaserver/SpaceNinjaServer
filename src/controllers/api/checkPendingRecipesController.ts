import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import { getInventory } from "../../services/inventoryService.ts";

export const checkPendingRecipesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "PendingRecipes");
    const now = Date.now();
    const resp: ICheckPendingRecipesResponse = {
        PendingRecipes: inventory.PendingRecipes.map(recipe => ({
            ItemType: recipe.ItemType,
            SecondsRemaining: Math.max(0, Math.floor((recipe.CompletionDate.getTime() - now) / 1000))
        }))
    };

    res.send(resp);
};

interface ICheckPendingRecipesResponse {
    PendingRecipes: {
        ItemType: string;
        SecondsRemaining: number;
    }[];
}
