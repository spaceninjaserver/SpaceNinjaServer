//this is a controller for the claimCompletedRecipe route
//it will claim a recipe for the user

import { RequestHandler } from "express";
import { logger } from "@/src/utils/logger";
import { getRecipe } from "@/src/services/itemDataService";
import { IOid } from "@/src/types/commonTypes";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import {
    getInventory,
    updateCurrency,
    addItem,
    addMiscItems,
    addRecipes,
    updateCurrencyByAccountId
} from "@/src/services/inventoryService";

export interface IClaimCompletedRecipeRequest {
    RecipeIds: IOid[];
}

export const claimCompletedRecipeController: RequestHandler = async (req, res) => {
    const claimCompletedRecipeRequest = getJSONfromString(String(req.body)) as IClaimCompletedRecipeRequest;
    const accountId = await getAccountIdForRequest(req);
    if (!accountId) throw new Error("no account id");

    const inventory = await getInventory(accountId);
    const pendingRecipe = inventory.PendingRecipes.find(
        recipe => recipe._id?.toString() === claimCompletedRecipeRequest.RecipeIds[0].$oid
    );
    if (!pendingRecipe) {
        throw new Error(`no pending recipe found with id ${claimCompletedRecipeRequest.RecipeIds[0].$oid}`);
    }

    //check recipe is indeed ready to be completed
    // if (pendingRecipe.CompletionDate > new Date()) {
    //     throw new Error(`recipe ${pendingRecipe._id} is not ready to be completed`);
    // }

    inventory.PendingRecipes.pull(pendingRecipe._id);
    await inventory.save();

    const recipe = getRecipe(pendingRecipe.ItemType);
    if (!recipe) {
        throw new Error(`no completed item found for recipe ${pendingRecipe._id.toString()}`);
    }

    if (req.query.cancel) {
        const inventory = await getInventory(accountId);
        const currencyChanges = updateCurrency(inventory, recipe.buildPrice * -1, false);
        addMiscItems(inventory, recipe.ingredients);
        await inventory.save();

        // Not a bug: In the specific case of cancelling a recipe, InventoryChanges are expected to be the root.
        res.json({
            ...currencyChanges,
            MiscItems: recipe.ingredients
        });
    } else {
        logger.debug("Claiming Recipe", { recipe, pendingRecipe });

        if (recipe.secretIngredientAction == "SIA_SPECTRE_LOADOUT_COPY") {
            const inventory = await getInventory(accountId);
            inventory.PendingSpectreLoadouts ??= [];
            inventory.SpectreLoadouts ??= [];

            const pendingLoadoutIndex = inventory.PendingSpectreLoadouts.findIndex(
                x => x.ItemType == recipe.resultType
            );
            if (pendingLoadoutIndex != -1) {
                const loadoutIndex = inventory.SpectreLoadouts.findIndex(x => x.ItemType == recipe.resultType);
                if (loadoutIndex != -1) {
                    inventory.SpectreLoadouts.splice(loadoutIndex, 1);
                }
                logger.debug(
                    "moving spectre loadout from pending to active",
                    inventory.toJSON().PendingSpectreLoadouts![pendingLoadoutIndex]
                );
                inventory.SpectreLoadouts.push(inventory.PendingSpectreLoadouts[pendingLoadoutIndex]);
                inventory.PendingSpectreLoadouts.splice(pendingLoadoutIndex, 1);
                await inventory.save();
            }
        }

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
                ...(await updateCurrencyByAccountId(recipe.skipBuildTimePrice, true, accountId))
            };
        }
        const inventory = await getInventory(accountId);
        InventoryChanges = {
            ...InventoryChanges,
            ...(await addItem(inventory, recipe.resultType, recipe.num)).InventoryChanges
        };
        await inventory.save();
        res.json({ InventoryChanges });
    }
};
