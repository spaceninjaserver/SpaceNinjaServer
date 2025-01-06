import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory, addMiscItems, updateCurrency, addRecipes } from "@/src/services/inventoryService";
import { IOid } from "@/src/types/commonTypes";
import {
    IConsumedSuit,
    IHelminthFoodRecord,
    IInfestedFoundry,
    IMiscItem,
    ITypeCount
} from "@/src/types/inventoryTypes/inventoryTypes";
import { ExportMisc, ExportRecipes } from "warframe-public-export-plus";
import { getRecipe } from "@/src/services/itemDataService";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { toMongoDate } from "@/src/helpers/inventoryHelpers";
import { logger } from "@/src/utils/logger";

export const infestedFoundryController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    switch (req.query.mode) {
        case "s": {
            // shard installation
            const request = getJSONfromString(String(req.body)) as IShardInstallRequest;
            const inventory = await getInventory(accountId);
            const suit = inventory.Suits.find(suit => suit._id.toString() == request.SuitId.$oid)!;
            if (!suit.ArchonCrystalUpgrades || suit.ArchonCrystalUpgrades.length != 5) {
                suit.ArchonCrystalUpgrades = [{}, {}, {}, {}, {}];
            }
            suit.ArchonCrystalUpgrades[request.Slot] = {
                UpgradeType: request.UpgradeType,
                Color: request.Color
            };
            const miscItemChanges = [
                {
                    ItemType: colorToShard[request.Color],
                    ItemCount: -1
                }
            ];
            addMiscItems(inventory, miscItemChanges);
            await inventory.save();
            res.json({
                InventoryChanges: {
                    MiscItems: miscItemChanges
                }
            });
            break;
        }

        case "x": {
            // shard removal
            const request = getJSONfromString(String(req.body)) as IShardUninstallRequest;
            const inventory = await getInventory(accountId);
            const suit = inventory.Suits.find(suit => suit._id.toString() == request.SuitId.$oid)!;

            // refund shard
            const shard = Object.entries(colorToShard).find(
                ([color]) => color == suit.ArchonCrystalUpgrades![request.Slot].Color
            )![1];
            const miscItemChanges = [
                {
                    ItemType: shard,
                    ItemCount: 1
                }
            ];
            addMiscItems(inventory, miscItemChanges);

            // remove from suit
            suit.ArchonCrystalUpgrades![request.Slot] = {};

            // remove bile
            const bile = inventory.InfestedFoundry!.Resources!.find(
                x => x.ItemType == "/Lotus/Types/Items/InfestedFoundry/HelminthBile"
            )!;
            bile.Count -= 300;

            await inventory.save();

            res.json({
                InventoryChanges: {
                    MiscItems: miscItemChanges,
                    InfestedFoundry: inventory.toJSON().InfestedFoundry
                }
            });
            break;
        }

        case "n": {
            // name the beast
            const request = getJSONfromString(String(req.body)) as IHelminthNameRequest;
            const inventory = await getInventory(accountId);
            inventory.InfestedFoundry ??= {};
            inventory.InfestedFoundry.Name = request.newName;
            await inventory.save();
            res.json({
                InventoryChanges: {
                    InfestedFoundry: {
                        Name: inventory.InfestedFoundry.Name
                    }
                }
            });
            break;
        }

        case "c": {
            // consume items
            const request = getJSONfromString(String(req.body)) as IHelminthFeedRequest;
            const inventory = await getInventory(accountId);
            inventory.InfestedFoundry ??= {};
            inventory.InfestedFoundry.Resources ??= [];

            const miscItemChanges: IMiscItem[] = [];
            let totalPercentagePointsGained = 0;

            const currentUnixSeconds = Math.trunc(new Date().getTime() / 1000);

            for (const contribution of request.ResourceContributions) {
                const snack = ExportMisc.helminthSnacks[contribution.ItemType];

                // tally items for removal
                const change = miscItemChanges.find(x => x.ItemType == contribution.ItemType);
                if (change) {
                    change.ItemCount -= snack.count;
                } else {
                    miscItemChanges.push({ ItemType: contribution.ItemType, ItemCount: snack.count * -1 });
                }

                if (snack.type == "/Lotus/Types/Items/InfestedFoundry/HelminthAppetiteCooldownReducer") {
                    // sentinent apetite
                    let mostDislikedSnackRecord: IHelminthFoodRecord = { ItemType: "", Date: 0 };
                    for (const resource of inventory.InfestedFoundry.Resources) {
                        if (resource.RecentlyConvertedResources) {
                            for (const record of resource.RecentlyConvertedResources) {
                                if (record.Date > mostDislikedSnackRecord.Date) {
                                    mostDislikedSnackRecord = record;
                                }
                            }
                        }
                    }
                    logger.debug("helminth eats sentient resource; most disliked snack:", {
                        type: mostDislikedSnackRecord.ItemType,
                        date: mostDislikedSnackRecord.Date
                    });
                    mostDislikedSnackRecord.Date = currentUnixSeconds + 24 * 60 * 60; // Possibly unfaithful
                    continue;
                }

                let resource = inventory.InfestedFoundry.Resources.find(x => x.ItemType == snack.type);
                if (!resource) {
                    resource =
                        inventory.InfestedFoundry.Resources[
                            inventory.InfestedFoundry.Resources.push({ ItemType: snack.type, Count: 0 }) - 1
                        ];
                }

                resource.RecentlyConvertedResources ??= [];
                let record = resource.RecentlyConvertedResources.find(x => x.ItemType == contribution.ItemType);
                if (!record) {
                    record =
                        resource.RecentlyConvertedResources[
                            resource.RecentlyConvertedResources.push({ ItemType: contribution.ItemType, Date: 0 }) - 1
                        ];
                }

                const hoursRemaining = (record.Date - currentUnixSeconds) / 3600;
                const apetiteFactor = apetiteModel(hoursRemaining) / 30;
                logger.debug(`helminth eating ${contribution.ItemType} (+${(snack.gain * 100).toFixed(0)}%)`, {
                    hoursRemaining,
                    apetiteFactor
                });
                if (hoursRemaining >= 18) {
                    record.Date = currentUnixSeconds + 72 * 60 * 60; // Possibly unfaithful
                } else {
                    record.Date = currentUnixSeconds + 24 * 60 * 60;
                }

                totalPercentagePointsGained += snack.gain * 100 * apetiteFactor; // 30% would be gain=0.3, so percentage points is equal to gain * 100.
                resource.Count += Math.trunc(snack.gain * 1000 * apetiteFactor); // 30% would be gain=0.3 or Count=300, so Count=gain*1000.
            }

            const recipeChanges = addInfestedFoundryXP(inventory.InfestedFoundry, 666 * totalPercentagePointsGained);
            addRecipes(inventory, recipeChanges);
            addMiscItems(inventory, miscItemChanges);
            await inventory.save();

            res.json({
                InventoryChanges: {
                    Recipes: recipeChanges,
                    InfestedFoundry: {
                        XP: inventory.InfestedFoundry.XP,
                        Resources: inventory.InfestedFoundry.Resources,
                        Slots: inventory.InfestedFoundry.Slots
                    },
                    MiscItems: miscItemChanges
                }
            });
            break;
        }

        case "o": {
            // offerings update
            const request = getJSONfromString(String(req.body)) as IHelminthOfferingsUpdate;
            const inventory = await getInventory(accountId);
            inventory.InfestedFoundry ??= {};
            inventory.InfestedFoundry.InvigorationIndex = request.OfferingsIndex;
            inventory.InfestedFoundry.InvigorationSuitOfferings = request.SuitTypes;
            if (request.Extra) {
                inventory.InfestedFoundry.InvigorationsApplied = 0;
            }
            await inventory.save();
            res.json({
                InventoryChanges: {
                    InfestedFoundry: inventory.toJSON().InfestedFoundry
                }
            });
            break;
        }

        case "a": {
            // subsume warframe
            const request = getJSONfromString(String(req.body)) as IHelminthSubsumeRequest;
            const inventory = await getInventory(accountId);
            const recipe = getRecipe(request.Recipe)!;
            for (const ingredient of recipe.secretIngredients!) {
                const resource = inventory.InfestedFoundry!.Resources!.find(x => x.ItemType == ingredient.ItemType);
                if (resource) {
                    resource.Count -= ingredient.ItemCount;
                }
            }
            const suit = inventory.Suits.find(x => x._id.toString() == request.SuitId.$oid)!;
            inventory.Suits.pull(suit);
            const consumedSuit: IConsumedSuit = { s: suit.ItemType };
            if (suit.Configs && suit.Configs[0] && suit.Configs[0].pricol) {
                consumedSuit.c = suit.Configs[0].pricol;
            }
            if ((inventory.InfestedFoundry!.XP ?? 0) < 73125_00) {
                inventory.InfestedFoundry!.Slots!--;
            }
            inventory.InfestedFoundry!.ConsumedSuits ??= [];
            inventory.InfestedFoundry!.ConsumedSuits?.push(consumedSuit);
            inventory.InfestedFoundry!.LastConsumedSuit = suit;
            inventory.InfestedFoundry!.AbilityOverrideUnlockCooldown = new Date(
                new Date().getTime() + 24 * 60 * 60 * 1000
            );
            const recipeChanges = addInfestedFoundryXP(inventory.InfestedFoundry!, 1600_00);
            addRecipes(inventory, recipeChanges);
            await inventory.save();
            res.json({
                InventoryChanges: {
                    Recipes: recipeChanges,
                    RemovedIdItems: [
                        {
                            ItemId: request.SuitId
                        }
                    ],
                    SuitBin: {
                        count: -1,
                        platinum: 0,
                        Slots: 1
                    },
                    InfestedFoundry: inventory.toJSON().InfestedFoundry
                }
            });
            break;
        }

        case "r": {
            // rush subsume
            const inventory = await getInventory(accountId);
            const currencyChanges = updateCurrency(inventory, 50, true);
            const recipeChanges = handleSubsumeCompletion(inventory);
            await inventory.save();
            res.json({
                InventoryChanges: {
                    ...currencyChanges,
                    Recipes: recipeChanges,
                    InfestedFoundry: inventory.toJSON().InfestedFoundry
                }
            });
            break;
        }

        case "u": {
            const request = getJSONfromString(String(req.body)) as IHelminthInvigorationRequest;
            const inventory = await getInventory(accountId);
            const suit = inventory.Suits.find(x => x._id.toString() == request.SuitId.$oid)!;
            const upgradesExpiry = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
            suit.OffensiveUpgrade = request.OffensiveUpgradeType;
            suit.DefensiveUpgrade = request.DefensiveUpgradeType;
            suit.UpgradesExpiry = upgradesExpiry;
            const recipeChanges = addInfestedFoundryXP(inventory.InfestedFoundry!, 4800_00);
            addRecipes(inventory, recipeChanges);
            for (let i = 0; i != request.ResourceTypes.length; ++i) {
                inventory.InfestedFoundry!.Resources!.find(x => x.ItemType == request.ResourceTypes[i])!.Count -=
                    request.ResourceCosts[i];
            }
            inventory.InfestedFoundry!.InvigorationsApplied ??= 0;
            inventory.InfestedFoundry!.InvigorationsApplied += 1;
            await inventory.save();
            res.json({
                SuitId: request.SuitId,
                OffensiveUpgrade: request.OffensiveUpgradeType,
                DefensiveUpgrade: request.DefensiveUpgradeType,
                UpgradesExpiry: toMongoDate(upgradesExpiry),
                InventoryChanges: {
                    Recipes: recipeChanges,
                    InfestedFoundry: inventory.toJSON().InfestedFoundry
                }
            });
            break;
        }

        case "custom_unlockall": {
            const inventory = await getInventory(accountId);
            inventory.InfestedFoundry ??= {};
            inventory.InfestedFoundry.XP ??= 0;
            if (151875_00 > inventory.InfestedFoundry.XP) {
                const recipeChanges = addInfestedFoundryXP(
                    inventory.InfestedFoundry,
                    151875_00 - inventory.InfestedFoundry.XP
                );
                addRecipes(inventory, recipeChanges);
                await inventory.save();
            }
            res.end();
            break;
        }

        default:
            throw new Error(`unhandled infestedFoundry mode: ${String(req.query.mode)}`);
    }
};

interface IShardInstallRequest {
    SuitId: IOid;
    Slot: number;
    UpgradeType: string;
    Color: string;
}

interface IShardUninstallRequest {
    SuitId: IOid;
    Slot: number;
}

interface IHelminthNameRequest {
    newName: string;
}

interface IHelminthFeedRequest {
    ResourceContributions: {
        ItemType: string;
        Date: number; // unix timestamp
    }[];
}

const colorToShard: Record<string, string> = {
    ACC_RED: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalAmar",
    ACC_RED_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalAmarMythic",
    ACC_YELLOW: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalNira",
    ACC_YELLOW_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalNiraMythic",
    ACC_BLUE: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalBoreal",
    ACC_BLUE_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalBorealMythic",
    ACC_GREEN: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalGreen",
    ACC_GREEN_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalGreenMythic",
    ACC_ORANGE: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalOrange",
    ACC_ORANGE_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalOrangeMythic",
    ACC_PURPLE: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalViolet",
    ACC_PURPLE_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalVioletMythic"
};

export const addInfestedFoundryXP = (infestedFoundry: IInfestedFoundry, delta: number): ITypeCount[] => {
    const recipeChanges: ITypeCount[] = [];
    infestedFoundry.XP ??= 0;
    const prevXP = infestedFoundry.XP;
    infestedFoundry.XP += delta;
    if (prevXP < 2250_00 && infestedFoundry.XP >= 2250_00) {
        infestedFoundry.Slots ??= 0;
        infestedFoundry.Slots += 3;
    }
    if (prevXP < 5625_00 && infestedFoundry.XP >= 5625_00) {
        recipeChanges.push({
            ItemType: "/Lotus/Types/Recipes/AbilityOverrides/HelminthShieldsBlueprint",
            ItemCount: 1
        });
    }
    if (prevXP < 10125_00 && infestedFoundry.XP >= 10125_00) {
        recipeChanges.push({ ItemType: "/Lotus/Types/Recipes/AbilityOverrides/HelminthHackBlueprint", ItemCount: 1 });
    }
    if (prevXP < 15750_00 && infestedFoundry.XP >= 15750_00) {
        infestedFoundry.Slots ??= 0;
        infestedFoundry.Slots += 10;
    }
    if (prevXP < 22500_00 && infestedFoundry.XP >= 22500_00) {
        recipeChanges.push({
            ItemType: "/Lotus/Types/Recipes/AbilityOverrides/HelminthAmmoEfficiencyBlueprint",
            ItemCount: 1
        });
    }
    if (prevXP < 30375_00 && infestedFoundry.XP >= 30375_00) {
        recipeChanges.push({ ItemType: "/Lotus/Types/Recipes/AbilityOverrides/HelminthStunBlueprint", ItemCount: 1 });
    }
    if (prevXP < 39375_00 && infestedFoundry.XP >= 39375_00) {
        infestedFoundry.Slots ??= 0;
        infestedFoundry.Slots += 20;
    }
    if (prevXP < 60750_00 && infestedFoundry.XP >= 60750_00) {
        recipeChanges.push({ ItemType: "/Lotus/Types/Recipes/AbilityOverrides/HelminthStatusBlueprint", ItemCount: 1 });
    }
    if (prevXP < 73125_00 && infestedFoundry.XP >= 73125_00) {
        infestedFoundry.Slots = 1;
    }
    if (prevXP < 86625_00 && infestedFoundry.XP >= 86625_00) {
        recipeChanges.push({
            ItemType: "/Lotus/Types/Recipes/AbilityOverrides/HelminthShieldArmorBlueprint",
            ItemCount: 1
        });
    }
    if (prevXP < 101250_00 && infestedFoundry.XP >= 101250_00) {
        recipeChanges.push({
            ItemType: "/Lotus/Types/Recipes/AbilityOverrides/HelminthProcBlockBlueprint",
            ItemCount: 1
        });
    }
    if (prevXP < 117000_00 && infestedFoundry.XP >= 117000_00) {
        recipeChanges.push({
            ItemType: "/Lotus/Types/Recipes/AbilityOverrides/HelminthEnergyShareBlueprint",
            ItemCount: 1
        });
    }
    if (prevXP < 133875_00 && infestedFoundry.XP >= 133875_00) {
        recipeChanges.push({
            ItemType: "/Lotus/Types/Recipes/AbilityOverrides/HelminthMaxStatusBlueprint",
            ItemCount: 1
        });
    }
    if (prevXP < 151875_00 && infestedFoundry.XP >= 151875_00) {
        recipeChanges.push({
            ItemType: "/Lotus/Types/Recipes/AbilityOverrides/HelminthTreasureBlueprint",
            ItemCount: 1
        });
    }
    return recipeChanges;
};

interface IHelminthSubsumeRequest {
    SuitId: IOid;
    Recipe: string;
}

export const handleSubsumeCompletion = (inventory: TInventoryDatabaseDocument): ITypeCount[] => {
    const [recipeType] = Object.entries(ExportRecipes).find(
        ([_recipeType, recipe]) =>
            recipe.secretIngredientAction == "SIA_WARFRAME_ABILITY" &&
            recipe.secretIngredients![0].ItemType == inventory.InfestedFoundry!.LastConsumedSuit!.ItemType
    )!;
    inventory.InfestedFoundry!.LastConsumedSuit = undefined;
    inventory.InfestedFoundry!.AbilityOverrideUnlockCooldown = undefined;
    const recipeChanges: ITypeCount[] = [
        {
            ItemType: recipeType,
            ItemCount: 1
        }
    ];
    addRecipes(inventory, recipeChanges);
    return recipeChanges;
};

interface IHelminthOfferingsUpdate {
    OfferingsIndex: number;
    SuitTypes: string[];
    Extra: boolean;
}

interface IHelminthInvigorationRequest {
    SuitId: IOid;
    OffensiveUpgradeType: string;
    DefensiveUpgradeType: string;
    ResourceTypes: string[];
    ResourceCosts: number[];
}

// A fitted model for observed apetite values. Likely slightly inaccurate.
//
// Hours remaining, percentage points gained (out of 30 total)
// 0, 30
// 5, 25.8
// 10, 21.6
// 12, 20
// 16, 16.6
// 17, 15.8
// 18, 15
// 20, 15
// 24, 15
// 36, 15
// 40, 13.6
// 47, 11.3
// 48, 11
// 50, 10.3
// 60, 7
// 70, 3.6
// 71, 3.3
// 72, 3
const apetiteModel = (x: number): number => {
    if (x <= 0) {
        return 30;
    }
    if (x < 18) {
        return -0.84 * x + 30;
    }
    if (x <= 36) {
        return 15;
    }
    if (x < 71.9) {
        return -0.3327892 * x + 26.94135;
    }
    return 3;
};
