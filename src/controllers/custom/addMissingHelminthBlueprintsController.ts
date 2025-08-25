import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory, addRecipes } from "@/src/services/inventoryService";
import type { RequestHandler } from "express";
import { ExportRecipes } from "warframe-public-export-plus";

export const addMissingHelminthBlueprintsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "Recipes");
    const allHelminthRecipes = Object.keys(ExportRecipes).filter(
        key => ExportRecipes[key].secretIngredientAction === "SIA_WARFRAME_ABILITY"
    );
    const inventoryHelminthRecipes = inventory.Recipes.filter(recipe =>
        recipe.ItemType.startsWith("/Lotus/Types/Recipes/AbilityOverrides/")
    ).map(recipe => recipe.ItemType);

    const missingHelminthRecipes = allHelminthRecipes
        .filter(key => !inventoryHelminthRecipes.includes(key))
        .map(ItemType => ({ ItemType, ItemCount: 1 }));

    addRecipes(inventory, missingHelminthRecipes);

    await inventory.save();
    res.end();
};
