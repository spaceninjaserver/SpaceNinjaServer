import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import { getInventory } from "../../services/inventoryService.ts";
import { modernToU5Recipes, U5Recipes, version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";

export const checkPendingRecipesController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const inventory = await getInventory(account._id, "PendingRecipes");
    const now = Date.now();
    const resp: ICheckPendingRecipesResponse = {
        PendingRecipes: inventory.PendingRecipes.map(recipe => ({
            ItemType: recipe.ItemType,
            SecondsRemaining: Math.max(0, Math.floor((recipe.CompletionDate.getTime() - now) / 1000))
        }))
    };

    if (version_compare(buildLabel, gameToBuildVersion["7.3.0"]) < 0) {
        resp.PendingRecipes = resp.PendingRecipes.map(recipe => {
            const U5ItemType = modernToU5Recipes[recipe.ItemType];
            return U5ItemType ? { ...recipe, ItemType: U5ItemType } : recipe;
        }).filter(recipe => U5Recipes.includes(recipe.ItemType));
    }

    res.send(resp);
};

interface ICheckPendingRecipesResponse {
    PendingRecipes: {
        ItemType: string;
        SecondsRemaining: number;
    }[];
}
