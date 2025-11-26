import { getAccountForRequest } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { logger } from "../../utils/logger.ts";
import type { RequestHandler } from "express";
import { getRecipe } from "../../services/itemDataService.ts";
import { addItem, addKubrowPet, freeUpSlot, getInventory, updateCurrency } from "../../services/inventoryService.ts";
import { unixTimesInMs } from "../../constants/timeConstants.ts";
import { Types } from "mongoose";
import type { ISpectreLoadout } from "../../types/inventoryTypes/inventoryTypes.ts";
import { InventorySlot } from "../../types/inventoryTypes/inventoryTypes.ts";
import { fromOid, toOid } from "../../helpers/inventoryHelpers.ts";
import { ExportWeapons } from "warframe-public-export-plus";
import { getRandomElement } from "../../services/rngService.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";

interface IStartRecipeRequest {
    RecipeName: string;
    Ids: string[];
}

export const startRecipeController: RequestHandler = async (req, res) => {
    const startRecipeRequest = getJSONfromString<IStartRecipeRequest>(String(req.body));
    logger.debug("StartRecipe Request", { startRecipeRequest });

    const account = await getAccountForRequest(req);
    const accountId = account._id.toString();

    let recipeName = startRecipeRequest.RecipeName;
    if (req.query.recipeName) recipeName = String(req.query.recipeName); // U8
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
        if (startRecipeRequest.Ids[i] && startRecipeRequest.Ids[i][0] != "/") {
            if (
                recipe.ingredients[i].ItemType == "/Lotus/Types/Game/KubrowPet/Eggs/KubrowEgg" ||
                recipe.ingredients[i].ItemType == "/Lotus/Types/Game/KubrowPet/Eggs/KubrowPetEggItem"
            ) {
                const index = inventory.KubrowPetEggs.findIndex(x => x._id.equals(startRecipeRequest.Ids[i]));
                if (index != -1) {
                    inventory.KubrowPetEggs.splice(index, 1);
                }
            } else {
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
            }
        } else {
            const itemType = recipe.ingredients[i].ItemType;
            const itemCount = recipe.ingredients[i].ItemCount;
            await addItem(inventory, itemType, itemCount * -1);
        }
    }

    let inventoryChanges: IInventoryChanges | undefined;
    if (recipe.secretIngredientAction == "SIA_CREATE_KUBROW") {
        inventoryChanges = addKubrowPet(
            inventory,
            getRandomElement(recipe.secretIngredients!)!.ItemType,
            undefined,
            false,
            {},
            account.BuildLabel
        );
        pr.KubrowPet = new Types.ObjectId(fromOid(inventoryChanges.KubrowPets![0].ItemId));
    } else if (recipe.secretIngredientAction == "SIA_DISTILL_PRINT") {
        pr.KubrowPet = new Types.ObjectId(startRecipeRequest.Ids[recipe.ingredients.length]);
        const pet = inventory.KubrowPets.id(pr.KubrowPet)!;
        pet.Details!.PrintsRemaining -= 1;
    } else if (recipe.secretIngredientAction == "SIA_SPECTRE_LOADOUT_COPY") {
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
    } else if (recipe.secretIngredientAction == "SIA_UNBRAND") {
        pr.SuitToUnbrand = new Types.ObjectId(startRecipeRequest.Ids[recipe.ingredients.length + 0]);
    }

    await inventory.save();

    res.json({ RecipeId: toOid(pr._id), InventoryChanges: inventoryChanges });
};
