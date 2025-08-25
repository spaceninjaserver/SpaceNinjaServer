//this is a controller for the claimCompletedRecipe route
//it will claim a recipe for the user

import type { RequestHandler } from "express";
import { logger } from "@/src/utils/logger";
import { getRecipe } from "@/src/services/itemDataService";
import type { IOid, IOidWithLegacySupport } from "@/src/types/commonTypes";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountForRequest } from "@/src/services/loginService";
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
} from "@/src/services/inventoryService";
import type { IInventoryChanges } from "@/src/types/purchaseTypes";
import type { IPendingRecipeDatabase } from "@/src/types/inventoryTypes/inventoryTypes";
import { InventorySlot } from "@/src/types/inventoryTypes/inventoryTypes";
import { toOid2 } from "@/src/helpers/inventoryHelpers";
import type { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import type { IRecipe } from "warframe-public-export-plus";
import type { IEquipmentClient } from "@/src/types/equipmentTypes";
import { EquipmentFeatures, Status } from "@/src/types/equipmentTypes";

interface IClaimCompletedRecipeRequest {
    RecipeIds: IOid[];
}

export const claimCompletedRecipeController: RequestHandler = async (req, res) => {
    const claimCompletedRecipeRequest = getJSONfromString<IClaimCompletedRecipeRequest>(String(req.body));
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id.toString());
    const pendingRecipe = inventory.PendingRecipes.id(claimCompletedRecipeRequest.RecipeIds[0].$oid);
    if (!pendingRecipe) {
        throw new Error(`no pending recipe found with id ${claimCompletedRecipeRequest.RecipeIds[0].$oid}`);
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
    } else {
        logger.debug("Claiming Recipe", { recipe, pendingRecipe });

        let BrandedSuits: undefined | IOidWithLegacySupport[];
        if (recipe.secretIngredientAction == "SIA_SPECTRE_LOADOUT_COPY") {
            inventory.PendingSpectreLoadouts ??= [];
            inventory.SpectreLoadouts ??= [];

            const pendingLoadoutIndex = inventory.PendingSpectreLoadouts.findIndex(
                x => x.ItemType == recipe.resultType
            );
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
            BrandedSuits = [toOid2(pendingRecipe.SuitToUnbrand!, account.BuildLabel)];
        }

        let InventoryChanges: IInventoryChanges = {};
        if (recipe.consumeOnUse) {
            addRecipes(inventory, [
                {
                    ItemType: pendingRecipe.ItemType,
                    ItemCount: -1
                }
            ]);
        }
        if (req.query.rush) {
            const end = Math.trunc(pendingRecipe.CompletionDate.getTime() / 1000);
            const start = end - recipe.buildTime;
            const secondsElapsed = Math.trunc(Date.now() / 1000) - start;
            const progress = secondsElapsed / recipe.buildTime;
            logger.debug(`rushing recipe at ${Math.trunc(progress * 100)}% completion`);
            const cost =
                progress > 0.5
                    ? Math.round(recipe.skipBuildTimePrice * (1 - (progress - 0.5)))
                    : recipe.skipBuildTimePrice;
            InventoryChanges = {
                ...InventoryChanges,
                ...updateCurrency(inventory, cost, true)
            };
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
            addKubrowPetPrint(inventory, pet, InventoryChanges);
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
                InventoryChanges.Upgrades ??= [];
                InventoryChanges.Upgrades.push(umbraModA, umbraModB, umbraModC, sacrificeModA, sacrificeModB);

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
                    InventoryChanges
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
                    InventoryChanges
                );
                inventory.XPInfo.push({
                    ItemType: "/Lotus/Weapons/Tenno/Melee/Swords/UmbraKatana/UmbraKatana",
                    XP: 450_000
                });
            } else {
                InventoryChanges = {
                    ...InventoryChanges,
                    ...(await addItem(
                        inventory,
                        recipe.resultType,
                        recipe.num,
                        false,
                        undefined,
                        pendingRecipe.TargetFingerprint
                    ))
                };
            }
        }
        if (
            inventory.claimingBlueprintRefundsIngredients &&
            recipe.secretIngredientAction != "SIA_CREATE_KUBROW" // Can't refund the egg
        ) {
            await refundRecipeIngredients(inventory, InventoryChanges, recipe, pendingRecipe);
        }
        await inventory.save();
        res.json({ InventoryChanges, BrandedSuits });
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
