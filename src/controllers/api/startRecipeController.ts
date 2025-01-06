import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";
import { getRecipe } from "@/src/services/itemDataService";
import { addMiscItems, getInventory, updateCurrency } from "@/src/services/inventoryService";
import { unixTimesInMs } from "@/src/constants/timeConstants";
import { Types } from "mongoose";
import { ISpectreLoadout } from "@/src/types/inventoryTypes/inventoryTypes";

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

    if (recipe.secretIngredientAction == "SIA_SPECTRE_LOADOUT_COPY") {
        const spectreLoadout: ISpectreLoadout = {
            ItemType: recipe.resultType,
            Suits: "",
            LongGuns: "",
            Pistols: "",
            Melee: ""
        };
        for (
            let secretIngredientsIndex = 0;
            secretIngredientsIndex != recipe.secretIngredients!.length;
            ++secretIngredientsIndex
        ) {
            const type = recipe.secretIngredients![secretIngredientsIndex].ItemType;
            const oid = startRecipeRequest.Ids[recipe.ingredients.length + secretIngredientsIndex];
            if (oid == "ffffffffffffffffffffffff") {
                // user chose to preserve the active loadout
                break;
            }
            if (type == "/Lotus/Types/Game/PowerSuits/PlayerPowerSuit") {
                const item = inventory.Suits.find(x => x._id.toString() == oid)!;
                spectreLoadout.Suits = item.ItemType;
            } else if (type == "/Lotus/Weapons/Tenno/Pistol/LotusPistol") {
                const item = inventory.Pistols.find(x => x._id.toString() == oid)!;
                spectreLoadout.Pistols = item.ItemType;
                spectreLoadout.PistolsModularParts = item.ModularParts;
            } else if (type == "/Lotus/Weapons/Tenno/LotusLongGun") {
                const item = inventory.LongGuns.find(x => x._id.toString() == oid)!;
                spectreLoadout.LongGuns = item.ItemType;
                spectreLoadout.LongGunsModularParts = item.ModularParts;
            } else {
                console.assert(type == "/Lotus/Types/Game/LotusMeleeWeapon");
                const item = inventory.Melee.find(x => x._id.toString() == oid)!;
                spectreLoadout.Melee = item.ItemType;
                spectreLoadout.MeleeModularParts = item.ModularParts;
            }
        }
        if (
            spectreLoadout.Suits != "" &&
            spectreLoadout.LongGuns != "" &&
            spectreLoadout.Pistols != "" &&
            spectreLoadout.Melee != ""
        ) {
            inventory.PendingSpectreLoadouts ??= [];
            const existingIndex = inventory.PendingSpectreLoadouts.findIndex(x => x.ItemType == recipe.resultType);
            if (existingIndex != -1) {
                inventory.PendingSpectreLoadouts.splice(existingIndex, 1);
            }
            inventory.PendingSpectreLoadouts.push(spectreLoadout);
            logger.debug("pending spectre loadout", spectreLoadout);
        }
    }

    const newInventory = await inventory.save();

    res.json({
        RecipeId: { $oid: newInventory.PendingRecipes[newInventory.PendingRecipes.length - 1]._id.toString() }
    });
};
