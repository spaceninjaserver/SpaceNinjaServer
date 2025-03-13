import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";
import { getRecipe } from "@/src/services/itemDataService";
import { addMiscItems, freeUpSlot, getInventory, updateCurrency } from "@/src/services/inventoryService";
import { unixTimesInMs } from "@/src/constants/timeConstants";
import { Types } from "mongoose";
import { InventorySlot, ISpectreLoadout } from "@/src/types/inventoryTypes/inventoryTypes";
import { toOid } from "@/src/helpers/inventoryHelpers";
import { ExportWeapons } from "warframe-public-export-plus";

interface IStartRecipeRequest {
    RecipeName: string;
    Ids: string[];
}

export const startRecipeController: RequestHandler = async (req, res) => {
    const startRecipeRequest = getJSONfromString<IStartRecipeRequest>(String(req.body));
    logger.debug("StartRecipe Request", { startRecipeRequest });

    const accountId = await getAccountIdForRequest(req);

    const recipeName = startRecipeRequest.RecipeName;
    const recipe = getRecipe(recipeName);

    if (!recipe) {
        throw new Error(`unknown recipe ${recipeName}`);
    }

    const inventory = await getInventory(accountId);
    updateCurrency(inventory, recipe.buildPrice, false);

    const pr =
        inventory.PendingRecipes[
            inventory.PendingRecipes.push({
                ItemType: recipeName,
                CompletionDate: new Date(Date.now() + recipe.buildTime * unixTimesInMs.second),
                _id: new Types.ObjectId()
            }) - 1
        ];

    for (let i = 0; i != recipe.ingredients.length; ++i) {
        if (startRecipeRequest.Ids[i]) {
            const category = ExportWeapons[recipe.ingredients[i].ItemType].productCategory;
            if (category != "LongGuns" && category != "Pistols" && category != "Melee") {
                throw new Error(`unexpected equipment ingredient type: ${category}`);
            }
            const equipmentIndex = inventory[category].findIndex(x => x._id.equals(startRecipeRequest.Ids[i]));
            if (equipmentIndex == -1) {
                throw new Error(`could not find equipment item to use for recipe`);
            }
            pr[category] ??= [];
            pr[category].push(inventory[category][equipmentIndex]);
            inventory[category].splice(equipmentIndex, 1);
            freeUpSlot(inventory, InventorySlot.WEAPONS);
        } else {
            addMiscItems(inventory, [
                {
                    ItemType: recipe.ingredients[i].ItemType,
                    ItemCount: recipe.ingredients[i].ItemCount * -1
                }
            ]);
        }
    }

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
                const item = inventory.Suits.id(oid)!;
                spectreLoadout.Suits = item.ItemType;
            } else if (type == "/Lotus/Weapons/Tenno/Pistol/LotusPistol") {
                const item = inventory.Pistols.id(oid)!;
                spectreLoadout.Pistols = item.ItemType;
                spectreLoadout.PistolsModularParts = item.ModularParts;
            } else if (type == "/Lotus/Weapons/Tenno/LotusLongGun") {
                const item = inventory.LongGuns.id(oid)!;
                spectreLoadout.LongGuns = item.ItemType;
                spectreLoadout.LongGunsModularParts = item.ModularParts;
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                console.assert(type == "/Lotus/Types/Game/LotusMeleeWeapon");
                const item = inventory.Melee.id(oid)!;
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

    await inventory.save();

    res.json({ RecipeId: toOid(pr._id) });
};
