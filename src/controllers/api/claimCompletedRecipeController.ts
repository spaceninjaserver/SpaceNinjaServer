//this is a controller for the claimCompletedRecipe route
//it will claim a recipe for the user

import { RequestHandler } from "express";
import { logger } from "@/src/utils/logger";
import { getRecipe } from "@/src/services/itemDataService";
import { IOid } from "@/src/types/commonTypes";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory, updateCurrency, addItem } from "@/src/services/inventoryService";

export interface IClaimCompletedRecipeRequest {
    RecipeIds: IOid[];
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const claimCompletedRecipeController: RequestHandler = async (req, res) => {
    const claimCompletedRecipeRequest = getJSONfromString(req.body.toString()) as IClaimCompletedRecipeRequest;
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
        // TODO: Refund items
        res.json({});
    } else {
        logger.debug("Claiming Recipe", { recipe, pendingRecipe });
        if (recipe.consumeOnUse) {
            // TODO: Remove one instance of this recipe, and include that in InventoryChanges.
        }
        let currencyChanges = {};
        if (req.query.rush && recipe.skipBuildTimePrice) {
            currencyChanges = await updateCurrency(recipe.skipBuildTimePrice, true, accountId);
        }
        res.json({
            InventoryChanges: {
                ...currencyChanges,
                ...(await addItem(accountId, recipe.resultType, recipe.num)).InventoryChanges
            }
        });
    }
};
