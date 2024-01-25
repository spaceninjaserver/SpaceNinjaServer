import { unixTimesInMs } from "@/src/constants/timeConstants";
import { getInventory } from "@/src/services/inventoryService";
import { getItemByBlueprint, getItemCategoryByUniqueName } from "@/src/services/itemDataService";
import { logger } from "@/src/utils/logger";
import { Types } from "mongoose";

export interface IResource {
    uniqueName: string;
    count: number;
}

// export const updateResources = async (accountId: string, components: IResource[]) => {
//     const inventory = await getInventory(accountId);

//     for (const component of components) {
//         const category = getItemCategoryByUniqueName(component.uniqueName) as keyof typeof inventory;
//         //validate category

//         console.log(component.uniqueName);
//         console.log("cate", category);

//         const invItem = inventory[category];
//         console.log("invItem", invItem);

//         inventory["MiscItems"];
//     }
// };

export const startRecipe = async (recipeName: string, accountId: string) => {
    const recipe = getItemByBlueprint(recipeName);

    if (!recipe) {
        logger.error(`unknown recipe ${recipeName}`);
        throw new Error(`unknown recipe ${recipeName}`);
    }

    const componentsNeeded = recipe.components?.map(component => ({
        uniqueName: component.uniqueName,
        count: component.itemCount
    }));

    if (!componentsNeeded) {
        logger.error(`recipe ${recipeName} has no components`);
        throw new Error(`recipe ${recipeName} has no components`);
    }

    //TODO: consume components used
    //await updateResources(accountId, componentsNeeded);

    //might be redundant
    if (recipe.consumeOnBuild) {
        //consume
    }

    if (!recipe.buildTime) {
        logger.error(`recipe ${recipeName} has no build time`);
        throw new Error(`recipe ${recipeName} has no build time`);
    }
    //buildtime is in seconds
    const completionDate = new Date(Date.now() + recipe.buildTime * unixTimesInMs.second);

    const inventory = await getInventory(accountId);
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
