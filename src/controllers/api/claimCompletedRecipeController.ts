//this is a controller for the claimCompletedRecipe route
//it will claim a recipe for the user

import { RequestHandler } from "express";
import { logger } from "@/src/utils/logger";
import { getRecipe } from "@/src/services/itemDataService";
import { IOid } from "@/src/types/commonTypes";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory, updateCurrency, addItem, addMiscItems, addRecipes } from "@/src/services/inventoryService";

export interface IClaimCompletedRecipeRequest {
    RecipeIds: IOid[];
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const claimCompletedRecipeController: RequestHandler = async (req, res) => {
    const claimCompletedRecipeRequest = getJSONfromString(String(req.body)) as IClaimCompletedRecipeRequest;
    const accountId = await getAccountIdForRequest(req);
    if (!accountId) throw new Error("no account id");

    const inventory = await getInventory(accountId);
    const pendingRecipe = inventory.PendingRecipes.find(
        recipe => recipe._id?.toString() === claimCompletedRecipeRequest.RecipeIds[0].$oid
    );
    if (!pendingRecipe) {
        logger.error(`no pending recipe found with id ${claimCompletedRecipeRequest.RecipeIds[0].$oid}`);
        throw new Error(`no pending recipe found with id ${claimCompletedRecipeRequest.RecipeIds[0].$oid}`);
    }

    //check recipe is indeed ready to be completed
    // if (pendingRecipe.CompletionDate > new Date()) {
    //     logger.error(`recipe ${pendingRecipe._id} is not ready to be completed`);
    //     throw new Error(`recipe ${pendingRecipe._id} is not ready to be completed`);
    // }

    inventory.PendingRecipes.pull(pendingRecipe._id);
    await inventory.save();

    const recipe = getRecipe(pendingRecipe.ItemType);
    if (!recipe) {
        logger.error(`no completed item found for recipe ${pendingRecipe._id}`);
        throw new Error(`no completed item found for recipe ${pendingRecipe._id}`);
    }

    if (req.query.cancel) {
        const currencyChanges = await updateCurrency(recipe.buildPrice * -1, false, accountId);

        const inventory = await getInventory(accountId);
        addMiscItems(inventory, recipe.ingredients);
        await inventory.save();

        // Not a bug: In the specific case of cancelling a recipe, InventoryChanges are expected to be the root.
        res.json({
            ...currencyChanges,
            MiscItems: recipe.ingredients
        });
    } else {
        logger.debug("Claiming Recipe", { recipe, pendingRecipe });
        let InventoryChanges = {};
        if (recipe.consumeOnUse) {
            const recipeChanges = [
                {
                    ItemType: pendingRecipe.ItemType,
                    ItemCount: -1
                }
            ];

            InventoryChanges = { ...InventoryChanges, Recipes: recipeChanges };

            const inventory = await getInventory(accountId);
            addRecipes(inventory, recipeChanges);
            await inventory.save();
        }
        if (req.query.rush) {
            InventoryChanges = {
                ...InventoryChanges,
                ...(await updateCurrency(recipe.skipBuildTimePrice, true, accountId))
            };
        }
        res.json({
            InventoryChanges: {
                ...InventoryChanges,
                ...(await addItem(accountId, recipe.resultType, recipe.num)).InventoryChanges
            }
        });
    }
};
