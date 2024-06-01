//this is a controller for the claimCompletedRecipe route
//it will claim a recipe for the user

import { RequestHandler } from "express";
import { logger } from "@/src/utils/logger";
import { getItemByBlueprint, getItemCategoryByUniqueName } from "@/src/services/itemDataService";
import { IOid } from "@/src/types/commonTypes";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";

export interface IClaimCompletedRecipeRequest {
    RecipeIds: IOid[];
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const claimCompletedRecipeController: RequestHandler = async (req, res) => {
    const claimCompletedRecipeRequest = getJSONfromString(req.body.toString()) as IClaimCompletedRecipeRequest;
    const accountId = await getAccountIdForRequest(req);
    if (!accountId) throw new Error("no account id");

    console.log(claimCompletedRecipeRequest);
    const inventory = await getInventory(accountId);
    const pendingRecipe = inventory.PendingRecipes.find(
        recipe => recipe._id?.toString() === claimCompletedRecipeRequest.RecipeIds[0].$oid
    );
    console.log(pendingRecipe);
    if (!pendingRecipe) {
        logger.error(`no pending recipe found with id ${claimCompletedRecipeRequest.RecipeIds[0].$oid}`);
        throw new Error(`no pending recipe found with id ${claimCompletedRecipeRequest.RecipeIds[0].$oid}`);
    }

    //check recipe is indeed ready to be completed
    // if (pendingRecipe.CompletionDate > new Date()) {
    //     logger.error(`recipe ${pendingRecipe._id} is not ready to be completed`);
    //     throw new Error(`recipe ${pendingRecipe._id} is not ready to be completed`);
    // }

    //get completed Items
    const completedItemName = getItemByBlueprint(pendingRecipe.ItemType)?.uniqueName;

    if (!completedItemName) {
        logger.error(`no completed item found for recipe ${pendingRecipe._id}`);
        throw new Error(`no completed item found for recipe ${pendingRecipe._id}`);
    }
    const itemCategory = getItemCategoryByUniqueName(completedItemName) as keyof typeof inventory;
    console.log(itemCategory);
    //TODO: remove all Schema.Mixed for inventory[itemCategory] not to be any
    //add item
    //inventory[itemCategory].

    //add additional item components like mods or weapons for a sentinel.
    //const additionalItemComponents = itemComponents[uniqueName]
    //add these items to inventory
    //return changes as InventoryChanges

    //remove pending recipe
    inventory.PendingRecipes.pull(pendingRecipe._id);
    // await inventory.save();

    logger.debug("Claiming Completed Recipe", { completedItemName });

    res.json({ InventoryChanges: {} });
};
