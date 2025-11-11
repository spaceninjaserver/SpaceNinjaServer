//this is a controller for the claimCompletedRecipe route
//it will claim a recipe for the user

import type { RequestHandler } from "express";
import { logger } from "../../utils/logger.ts";
import { getRecipe } from "../../services/itemDataService.ts";
import type { IOidWithLegacySupport } from "../../types/commonTypes.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import type { TAccountDocument } from "../../services/loginService.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import {
    getInventory,
    updateCurrency,
    addItem,
    addRecipes,
    occupySlot,
    combineInventoryChanges,
    addKubrowPetPrint,
    addPowerSuit,
    addEquipment
} from "../../services/inventoryService.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import type { IPendingRecipeDatabase } from "../../types/inventoryTypes/inventoryTypes.ts";
import { InventorySlot } from "../../types/inventoryTypes/inventoryTypes.ts";
import { fromOid, toOid2 } from "../../helpers/inventoryHelpers.ts";
import type { TInventoryDatabaseDocument } from "../../models/inventoryModels/inventoryModel.ts";
import type { IRecipe } from "warframe-public-export-plus";
import type { IEquipmentClient } from "../../types/equipmentTypes.ts";
import { EquipmentFeatures, Status } from "../../types/equipmentTypes.ts";

interface IClaimCompletedRecipeRequest {
    RecipeIds: IOidWithLegacySupport[];
}

interface IClaimCompletedRecipeResponse {
    InventoryChanges: IInventoryChanges;
    BrandedSuits?: IOidWithLegacySupport[];
}

export const claimCompletedRecipeController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id.toString());
    const resp: IClaimCompletedRecipeResponse = {
        InventoryChanges: {}
    };
    if (!req.query.recipeName) {
        const claimCompletedRecipeRequest = getJSONfromString<IClaimCompletedRecipeRequest>(String(req.body));
        for (const recipeId of claimCompletedRecipeRequest.RecipeIds) {
            const pendingRecipe = inventory.PendingRecipes.id(fromOid(recipeId));
            if (!pendingRecipe) {
                throw new Error(`no pending recipe found with id ${fromOid(recipeId)}`);
            }

            //check recipe is indeed ready to be completed
            // if (pendingRecipe.CompletionDate > new Date()) {
            //     throw new Error(`recipe ${pendingRecipe._id} is not ready to be completed`);
            // }

            inventory.PendingRecipes.pull(pendingRecipe._id);

            const recipe = getRecipe(pendingRecipe.ItemType);
            if (!recipe) {
                throw new Error(`no completed item found for recipe ${pendingRecipe._id.toString()}`);
            }

            if (req.query.cancel) {
                const inventoryChanges: IInventoryChanges = {};
                await refundRecipeIngredients(inventory, inventoryChanges, recipe, pendingRecipe);
                await inventory.save();
                res.json(inventoryChanges); // Not a bug: In the specific case of cancelling a recipe, InventoryChanges are expected to be the root.
                return;
            }

            await claimCompletedRecipe(account, inventory, recipe, pendingRecipe, resp, req.query.rush);
        }
    } else {
        const recipeName = String(req.query.recipeName); // U8
        const pendingRecipe = inventory.PendingRecipes.find(r => r.ItemType == recipeName);
        if (!pendingRecipe) {
            throw new Error(`no pending recipe found with ItemType ${recipeName}`);
        }

        inventory.PendingRecipes.pull(pendingRecipe._id);

        const recipe = getRecipe(pendingRecipe.ItemType);
        if (!recipe) {
            throw new Error(`no completed item found for recipe ${pendingRecipe._id.toString()}`);
        }
        await claimCompletedRecipe(
            account,
            inventory,
            recipe,
            pendingRecipe,
            resp,
            req.path.includes("instantCompleteRecipe.php")
        );
    }
    await inventory.save();
    res.json(resp);
};

const claimCompletedRecipe = async (
    account: TAccountDocument,
    inventory: TInventoryDatabaseDocument,
    recipe: IRecipe,
    pendingRecipe: IPendingRecipeDatabase,
    resp: IClaimCompletedRecipeResponse,
    rush: any
): Promise<void> => {
    logger.debug("Claiming Recipe", { recipe, pendingRecipe });

    if (recipe.secretIngredientAction == "SIA_SPECTRE_LOADOUT_COPY") {
        inventory.PendingSpectreLoadouts ??= [];
        inventory.SpectreLoadouts ??= [];

        const pendingLoadoutIndex = inventory.PendingSpectreLoadouts.findIndex(x => x.ItemType == recipe.resultType);
        if (pendingLoadoutIndex != -1) {
            const loadoutIndex = inventory.SpectreLoadouts.findIndex(x => x.ItemType == recipe.resultType);
            if (loadoutIndex != -1) {
                inventory.SpectreLoadouts.splice(loadoutIndex, 1);
            }
            logger.debug(
                "moving spectre loadout from pending to active",
                inventory.toJSON().PendingSpectreLoadouts![pendingLoadoutIndex]
            );
            inventory.SpectreLoadouts.push(inventory.PendingSpectreLoadouts[pendingLoadoutIndex]);
            inventory.PendingSpectreLoadouts.splice(pendingLoadoutIndex, 1);
        }
    } else if (recipe.secretIngredientAction == "SIA_UNBRAND") {
        inventory.BrandedSuits!.splice(
            inventory.BrandedSuits!.findIndex(x => x.equals(pendingRecipe.SuitToUnbrand)),
            1
        );
        resp.BrandedSuits = [toOid2(pendingRecipe.SuitToUnbrand!, account.BuildLabel)];
    }

    if (recipe.consumeOnUse) {
        addRecipes(inventory, [
            {
                ItemType: pendingRecipe.ItemType,
                ItemCount: -1
            }
        ]);
    }

    if (rush) {
        const end = Math.trunc(pendingRecipe.CompletionDate.getTime() / 1000);
        const start = end - recipe.buildTime;
        const secondsElapsed = Math.trunc(Date.now() / 1000) - start;
        const progress = secondsElapsed / recipe.buildTime;
        logger.debug(`rushing recipe at ${Math.trunc(progress * 100)}% completion`);
        const cost =
            progress > 0.5 ? Math.round(recipe.skipBuildTimePrice * (1 - (progress - 0.5))) : recipe.skipBuildTimePrice;
        combineInventoryChanges(resp.InventoryChanges, updateCurrency(inventory, cost, true));
    }

    if (recipe.secretIngredientAction == "SIA_CREATE_KUBROW") {
        const pet = inventory.KubrowPets.id(pendingRecipe.KubrowPet!)!;
        if (pet.Details!.HatchDate!.getTime() > Date.now()) {
            pet.Details!.HatchDate = new Date();
        }
        let canSetActive = true;
        for (const pet of inventory.KubrowPets) {
            if (pet.Details!.Status == Status.StatusAvailable) {
                canSetActive = false;
                break;
            }
        }
        pet.Details!.Status = canSetActive ? Status.StatusAvailable : Status.StatusStasis;
    } else if (recipe.secretIngredientAction == "SIA_DISTILL_PRINT") {
        const pet = inventory.KubrowPets.id(pendingRecipe.KubrowPet!)!;
        addKubrowPetPrint(inventory, pet, resp.InventoryChanges);
    } else if (recipe.secretIngredientAction != "SIA_UNBRAND") {
        if (recipe.resultType == "/Lotus/Powersuits/Excalibur/ExcaliburUmbra") {
            // Quite the special case here...
            // We don't just get Umbra, but also Skiajati and Umbra Mods. Both items are max rank, potatoed, and with the mods are pre-installed.
            // Source: https://wiki.warframe.com/w/The_Sacrifice, https://wiki.warframe.com/w/Excalibur/Umbra, https://wiki.warframe.com/w/Skiajati

            const umbraModA = (
                await addItem(
                    inventory,
                    "/Lotus/Upgrades/Mods/Sets/Umbra/WarframeUmbraModA",
                    1,
                    false,
                    undefined,
                    `{"lvl":5}`
                )
            ).Upgrades![0];
            const umbraModB = (
                await addItem(
                    inventory,
                    "/Lotus/Upgrades/Mods/Sets/Umbra/WarframeUmbraModB",
                    1,
                    false,
                    undefined,
                    `{"lvl":5}`
                )
            ).Upgrades![0];
            const umbraModC = (
                await addItem(
                    inventory,
                    "/Lotus/Upgrades/Mods/Sets/Umbra/WarframeUmbraModC",
                    1,
                    false,
                    undefined,
                    `{"lvl":5}`
                )
            ).Upgrades![0];
            const sacrificeModA = (
                await addItem(
                    inventory,
                    "/Lotus/Upgrades/Mods/Sets/Sacrifice/MeleeSacrificeModA",
                    1,
                    false,
                    undefined,
                    `{"lvl":5}`
                )
            ).Upgrades![0];
            const sacrificeModB = (
                await addItem(
                    inventory,
                    "/Lotus/Upgrades/Mods/Sets/Sacrifice/MeleeSacrificeModB",
                    1,
                    false,
                    undefined,
                    `{"lvl":5}`
                )
            ).Upgrades![0];
            resp.InventoryChanges.Upgrades ??= [];
            resp.InventoryChanges.Upgrades.push(umbraModA, umbraModB, umbraModC, sacrificeModA, sacrificeModB);

            await addPowerSuit(
                inventory,
                "/Lotus/Powersuits/Excalibur/ExcaliburUmbra",
                {
                    Configs: [
                        {
                            Upgrades: [
                                "",
                                "",
                                "",
                                "",
                                "",
                                umbraModA.ItemId.$oid,
                                umbraModB.ItemId.$oid,
                                umbraModC.ItemId.$oid
                            ]
                        }
                    ],
                    XP: 900_000,
                    Features: EquipmentFeatures.DOUBLE_CAPACITY
                },
                resp.InventoryChanges
            );
            inventory.XPInfo.push({
                ItemType: "/Lotus/Powersuits/Excalibur/ExcaliburUmbra",
                XP: 900_000
            });

            addEquipment(
                inventory,
                "Melee",
                "/Lotus/Weapons/Tenno/Melee/Swords/UmbraKatana/UmbraKatana",
                {
                    Configs: [
                        { Upgrades: ["", "", "", "", "", "", sacrificeModA.ItemId.$oid, sacrificeModB.ItemId.$oid] }
                    ],
                    XP: 450_000,
                    Features: EquipmentFeatures.DOUBLE_CAPACITY
                },
                resp.InventoryChanges
            );
            inventory.XPInfo.push({
                ItemType: "/Lotus/Weapons/Tenno/Melee/Swords/UmbraKatana/UmbraKatana",
                XP: 450_000
            });
        } else {
            combineInventoryChanges(
                resp.InventoryChanges,
                await addItem(
                    inventory,
                    recipe.resultType,
                    recipe.num,
                    false,
                    undefined,
                    pendingRecipe.TargetFingerprint
                )
            );
        }
    }
    if (
        inventory.claimingBlueprintRefundsIngredients &&
        recipe.secretIngredientAction != "SIA_CREATE_KUBROW" // Can't refund the egg
    ) {
        await refundRecipeIngredients(inventory, resp.InventoryChanges, recipe, pendingRecipe);
    }
};

const refundRecipeIngredients = async (
    inventory: TInventoryDatabaseDocument,
    inventoryChanges: IInventoryChanges,
    recipe: IRecipe,
    pendingRecipe: IPendingRecipeDatabase
): Promise<void> => {
    updateCurrency(inventory, recipe.buildPrice * -1, false, inventoryChanges);

    const equipmentIngredients = new Set();
    for (const category of ["LongGuns", "Pistols", "Melee"] as const) {
        if (pendingRecipe[category]) {
            pendingRecipe[category].forEach(item => {
                const index = inventory[category].push(item) - 1;
                inventoryChanges[category] ??= [];
                inventoryChanges[category].push(inventory[category][index].toJSON<IEquipmentClient>());
                equipmentIngredients.add(item.ItemType);

                occupySlot(inventory, InventorySlot.WEAPONS, false);
                inventoryChanges.WeaponBin ??= { Slots: 0 };
                inventoryChanges.WeaponBin.Slots -= 1;
            });
        }
    }
    for (const ingredient of recipe.ingredients) {
        if (!equipmentIngredients.has(ingredient.ItemType)) {
            combineInventoryChanges(
                inventoryChanges,
                await addItem(inventory, ingredient.ItemType, ingredient.ItemCount)
            );
        }
    }
};
