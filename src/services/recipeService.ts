import { getInventory } from "@/src/services/inventoryService";
import { Types } from "mongoose";

export const startRecipe = async (recipeName: string, accountId: string) => {
    //get recipe data

    //consume resources
    const inventory = await getInventory(accountId);
    inventory.PendingRecipes.push({
        ItemType: recipeName,
        CompletionDate: new Date(),
        _id: new Types.ObjectId()
    });

    const newInventory = await inventory.save();

    return {
        RecipeId: { $oid: newInventory.PendingRecipes[newInventory.PendingRecipes.length - 1]._id?.toString() }
    };
};
