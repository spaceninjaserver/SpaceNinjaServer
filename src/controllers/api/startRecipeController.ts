import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";
import { getRecipe } from "@/src/services/itemDataService";
import { addMiscItems, getInventory, updateCurrency } from "@/src/services/inventoryService";
import { unixTimesInMs } from "@/src/constants/timeConstants";
import { Types } from "mongoose";

interface IStartRecipeRequest {
    RecipeName: string;
    Ids: string[];
}

export const startRecipeController: RequestHandler = async (req, res) => {
    const startRecipeRequest = getJSONfromString(String(req.body)) as IStartRecipeRequest;
    logger.debug("StartRecipe Request", { startRecipeRequest });

    const accountId = await getAccountIdForRequest(req);

    const recipeName = startRecipeRequest.RecipeName;
    const recipe = getRecipe(recipeName);

    if (!recipe) {
        logger.error(`unknown recipe ${recipeName}`);
        throw new Error(`unknown recipe ${recipeName}`);
    }

    const ingredientsInverse = recipe.ingredients.map(component => ({
        ItemType: component.ItemType,
        ItemCount: component.ItemCount * -1
    }));

    const inventory = await getInventory(accountId);
    updateCurrency(inventory, recipe.buildPrice, false);
    addMiscItems(inventory, ingredientsInverse);

    //buildtime is in seconds
    const completionDate = new Date(Date.now() + recipe.buildTime * unixTimesInMs.second);

    inventory.PendingRecipes.push({
        ItemType: recipeName,
        CompletionDate: completionDate,
        _id: new Types.ObjectId()
    });

    const newInventory = await inventory.save();

    res.json({
        RecipeId: { $oid: newInventory.PendingRecipes[newInventory.PendingRecipes.length - 1]._id.toString() }
    });
};
