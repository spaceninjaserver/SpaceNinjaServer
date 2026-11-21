import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory, addRecipes } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import { ExportRecipes } from "warframe-public-export-plus";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import { logger } from "../../utils/logger.ts";

export const addMissingHelminthBlueprintsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "Recipes InfestedFoundry");
    let count = 0;

    for (const [recipeType, recipe] of Object.entries(ExportRecipes)) {
        if (recipe.secretIngredientAction == "SIA_WARFRAME_ABILITY") {
            if (!inventory.Recipes.some(recipe => recipe.ItemType == recipeType)) {
                logger.trace(`adding recipe: ${recipeType}`);
                addRecipes(inventory, [{ ItemType: recipeType, ItemCount: 1 }]);
                ++count;

                const suitType = recipe.secretIngredients!.find(x =>
                    x.ItemType.startsWith("/Lotus/Powersuits")
                )?.ItemType;
                if (suitType) {
                    logger.trace(`adding consumed suit: ${suitType}`);
                    inventory.InfestedFoundry ??= {};
                    inventory.InfestedFoundry.ConsumedSuits ??= [];
                    inventory.InfestedFoundry.ConsumedSuits.push({ s: suitType });
                }
            }
        }
    }

    if (count != 0) {
        await inventory.save();
        broadcastInventoryUpdate(req);
    }
    res.json({ count });
};
