import type { RequestHandler } from "express";
import { logger } from "../../utils/logger.ts";
import { getRecipe } from "../../services/itemDataService.ts";
import type { IOidWithLegacySupport, ITypeCount } from "../../types/commonTypes.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getAccountForRequest, getBuildVersion } from "../../services/loginService.ts";
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
import { eInventorySlot } from "../../types/inventoryTypes/inventoryTypes.ts";
import { fromOid, toLegacyOid, toOid2, U5ToModernRecipes } from "../../helpers/inventoryHelpers.ts";
import type { TInventoryDatabaseDocument } from "../../models/inventoryModels/inventoryModel.ts";
import type { IRecipe } from "warframe-public-export-plus";
import type { IEquipmentClient } from "../../types/equipmentTypes.ts";
import { eEquipmentFeatures, eStatus } from "../../types/equipmentTypes.ts";
import { pseudoRecipeToOwnedRecipeMap } from "../../services/foundryService.ts";
import gameToBuildVersionInt from "../../constants/gameToBuildVersionInt.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import { buildVersionToInt } from "../../helpers/versionHelper.ts";

interface IClaimCompletedRecipeRequest {
    RecipeIds?: IOidWithLegacySupport[]; // U24.4 and beyond
    recipeNames?: string[]; // Builds before U24.4 down to U22.20
}

interface IClaimCompletedRecipeResponse {
    InventoryChanges: IInventoryChanges;
    BrandedSuits?: IOidWithLegacySupport[];
}

export const claimCompletedRecipeController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildVersion = getBuildVersion(req, account);
    const inventory = await getInventory(account._id, undefined);
    const resp: IClaimCompletedRecipeResponse = {
        InventoryChanges: {}
    };
    if (!req.query.recipeName) {
        const claimCompletedRecipeRequest = getJSONfromString<IClaimCompletedRecipeRequest>(String(req.body));
        const recipes = claimCompletedRecipeRequest.recipeNames ?? claimCompletedRecipeRequest.RecipeIds;
        if (recipes) {
            for (const recipeId of recipes) {
                let pendingRecipe;
                if (typeof recipeId === "string") {
                    pendingRecipe = inventory.PendingRecipes.find(r => r.ItemType == recipeId);
                    if (!pendingRecipe) {
                        throw new Error(`no pending recipe found of type ${recipeId}`);
                    }
                } else {
                    pendingRecipe = inventory.PendingRecipes.id(fromOid(recipeId));
                    if (!pendingRecipe) {
                        throw new Error(`no pending recipe found with id ${fromOid(recipeId)}`);
                    }
                }

                //check recipe is indeed ready to be completed
                // if (pendingRecipe.CompletionDate > new Date()) {
                //     throw new Error(`recipe ${pendingRecipe._id} is not ready to be completed`);
                // }

                inventory.PendingRecipes.pull(pendingRecipe._id);

                const recipe = getRecipe(pendingRecipe.ItemType, buildVersion);
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

                await claimCompletedRecipe(buildVersion, inventory, recipe, pendingRecipe, resp, req.query.rush);
            }
        } else {
            throw new Error(`recipe list from request was undefined?`);
        }
    } else {
        let recipeName = String(req.query.recipeName); // U8
        if (buildVersion < gameToBuildVersionInt["7.3.0"]) {
            const modernItemType = U5ToModernRecipes[recipeName];
            if (modernItemType) recipeName = modernItemType;
        }
        const pendingRecipe = inventory.PendingRecipes.find(r => r.ItemType == recipeName);
        if (!pendingRecipe) {
            throw new Error(`no pending recipe found with ItemType ${recipeName}`);
        }

        inventory.PendingRecipes.pull(pendingRecipe._id);

        const recipe = getRecipe(pendingRecipe.ItemType, buildVersion);
        if (!recipe) {
            throw new Error(`no completed item found for recipe ${pendingRecipe._id.toString()}`);
        }
        await claimCompletedRecipe(
            buildVersion,
            inventory,
            recipe,
            pendingRecipe,
            resp,
            req.path.includes("instantCompleteRecipe.php") || req.query.rush
        );
    }
    await inventory.save();

    if (buildVersion >= gameToBuildVersionInt["21.0.0"]) {
        res.json(resp);
        broadcastInventoryUpdate(req);
        return;
    }

    // U14-U20 expect inventory changes at the root of the response instead of under InventoryChanges.
    if (buildVersion >= gameToBuildVersionInt["14.0.0"]) {
        if (buildVersion <= gameToBuildVersionInt["19.5.3"]) {
            // ItemIds must be converted to legacy format for U19.5 and below or the client will be unhappy.
            for (const category of [
                "KubrowPets",
                "Suits",
                "LongGuns",
                "Pistols",
                "Melee",
                "Sentinels",
                "SentinelWeapons",
                "SpaceSuits",
                "SpaceGuns",
                "SpaceMelee",
                "KubrowPetPrints",
                "WeaponSkins",
                "Drones"
            ] as const) {
                resp.InventoryChanges[category]?.forEach(x => toLegacyOid(x.ItemId));
            }
        }

        // Categories not listed in the response are not required, they are hard-coded by the client to be claimed without response data.
        res.json({
            PremiumCredits: inventory.infinitePlatinum ? 999999999 : inventory.PremiumCredits,
            PremiumCreditsFree: inventory.infinitePlatinum ? 0 : inventory.PremiumCreditsFree,
            KubrowPets: resp.InventoryChanges.KubrowPets,
            Suits: resp.InventoryChanges.Suits,
            LongGuns: resp.InventoryChanges.LongGuns,
            Pistols: resp.InventoryChanges.Pistols,
            Melee: resp.InventoryChanges.Melee,
            Sentinels: resp.InventoryChanges.Sentinels,
            SentinelWeapons: resp.InventoryChanges.SentinelWeapons,
            SpaceSuits: resp.InventoryChanges.SpaceSuits,
            SpaceGuns: resp.InventoryChanges.SpaceGuns,
            SpaceMelee: resp.InventoryChanges.SpaceMelee,
            KubrowPetPrints: resp.InventoryChanges.KubrowPetPrints,
            WeaponSkins: resp.InventoryChanges.WeaponSkins,
            Drones: resp.InventoryChanges.Drones,
            BrandedSuits: resp.BrandedSuits
        });
        broadcastInventoryUpdate(req);
        return;
    }

    // Builds before U14 hard-code claiming all items on the client and do not require a json response.
    res.status(200).end();
    broadcastInventoryUpdate(req);
};

const claimCompletedRecipe = async (
    buildVersion: number,
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
        resp.BrandedSuits = [toOid2(pendingRecipe.SuitToUnbrand!, buildVersion)];
    }

    if (recipe.consumeOnUse) {
        const recipeChanges: ITypeCount[] = [
            {
                ItemType: pseudoRecipeToOwnedRecipeMap[pendingRecipe.ItemType] ?? pendingRecipe.ItemType,
                ItemCount: -1
            }
        ];
        addRecipes(inventory, recipeChanges);
        if (recipeChanges[0].ItemType != pendingRecipe.ItemType) {
            combineInventoryChanges(resp.InventoryChanges, { Recipes: recipeChanges });
        }
    }

    if (rush && !inventory.dontSubtractRushPlatinumCost) {
        let cost = recipe.skipBuildTimePrice;
        const end = Math.trunc(pendingRecipe.CompletionDate.getTime() / 1000);
        const start = end - recipe.buildTime;
        const secondsElapsed = Math.trunc(Date.now() / 1000) - start;
        const progress = secondsElapsed / recipe.buildTime;
        logger.debug(`rushing recipe at ${Math.trunc(progress * 100)}% completion`);
        // U18 introduced rush cost scaling, don't use it for older versions.
        if (buildVersion >= buildVersionToInt("2015.12.03.00.00")) {
            // Haven't found the real build label for U18.0.0 yet, but this works
            cost =
                progress > 0.5
                    ? Math.round(recipe.skipBuildTimePrice * (1 - (progress - 0.5)))
                    : recipe.skipBuildTimePrice;
        }
        combineInventoryChanges(resp.InventoryChanges, updateCurrency(inventory, cost, true));
    }

    if (recipe.secretIngredientAction == "SIA_CREATE_KUBROW") {
        // This request is sent automatically once the pending recipe is completed.
        const pet = inventory.KubrowPets.id(pendingRecipe.KubrowPet!)!;
        pet.Details.Status = eStatus.StatusIncubated;
    } else if (recipe.secretIngredientAction == "SIA_DISTILL_PRINT") {
        const pet = inventory.KubrowPets.id(pendingRecipe.KubrowPet!)!;
        addKubrowPetPrint(
            inventory,
            "/Lotus/Types/Game/KubrowPet/ImprintedTraitPrint",
            pet.Details,
            resp.InventoryChanges,
            pet.ModularParts
        );
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
                                fromOid(umbraModA.ItemId),
                                fromOid(umbraModB.ItemId),
                                fromOid(umbraModC.ItemId)
                            ]
                        }
                    ],
                    XP: 900_000,
                    Features: eEquipmentFeatures.DOUBLE_CAPACITY
                },
                buildVersion,
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
                        {
                            Upgrades: [
                                "",
                                "",
                                "",
                                "",
                                "",
                                "",
                                fromOid(sacrificeModA.ItemId),
                                fromOid(sacrificeModB.ItemId)
                            ]
                        }
                    ],
                    XP: 450_000,
                    Features: eEquipmentFeatures.DOUBLE_CAPACITY
                },
                resp.InventoryChanges
            );
            inventory.XPInfo.push({
                ItemType: "/Lotus/Weapons/Tenno/Melee/Swords/UmbraKatana/UmbraKatana",
                XP: 450_000
            });
        } else if (
            recipe.resultType == "/Lotus/Types/JadeShadowsPart2Mission/Gameplay/Resources/HunhowTrinketMiscItem"
        ) {
            combineInventoryChanges(
                resp.InventoryChanges,
                await addItem(
                    inventory,
                    "/Lotus/Weapons/Tenno/Melee/Swords/PrimeWar/PrimeWarWeapon",
                    recipe.num,
                    true,
                    undefined,
                    pendingRecipe.TargetFingerprint,
                    undefined,
                    buildVersion
                )
            );
        } else {
            combineInventoryChanges(
                resp.InventoryChanges,
                await addItem(
                    inventory,
                    recipe.resultType,
                    recipe.num,
                    false,
                    undefined,
                    pendingRecipe.TargetFingerprint,
                    undefined,
                    buildVersion
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

                occupySlot(inventory, eInventorySlot.WEAPONS, false);
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
