import { unixTimesInMs } from "@/src/constants/timeConstants";
import { addMiscItems, getInventory, updateCurrency } from "@/src/services/inventoryService";
import { getRecipe } from "@/src/services/itemDataService";
import { logger } from "@/src/utils/logger";
import { Types } from "mongoose";

export const startRecipe = async (recipeName: string, accountId: string) => {
    const recipe = getRecipe(recipeName);

    if (!recipe) {
        logger.error(`unknown recipe ${recipeName}`);
        throw new Error(`unknown recipe ${recipeName}`);
    }

    await updateCurrency(recipe.buildPrice, false, accountId);

    const ingredientsInverse = recipe.ingredients.map(component => ({
        ItemType: component.ItemType,
        ItemCount: component.ItemCount * -1
    }));

    const inventory = await getInventory(accountId);
    addMiscItems(inventory, ingredientsInverse);

    //buildtime is in seconds
    const completionDate = new Date(Date.now() + recipe.buildTime * unixTimesInMs.second);

    inventory.PendingRecipes.push({
        ItemType: recipeName,
        CompletionDate: completionDate,
        _id: new Types.ObjectId()
    });

    const newInventory = await inventory.save();

    return {
        RecipeId: { $oid: newInventory.PendingRecipes[newInventory.PendingRecipes.length - 1]._id?.toString() }
    };
};
