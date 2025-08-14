import { RequestHandler } from "express";
import { getAccountForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory, addMiscItems, updateCurrency, addRecipes, freeUpSlot } from "@/src/services/inventoryService";
import { IOid } from "@/src/types/commonTypes";
import {
    IConsumedSuit,
    IHelminthFoodRecord,
    IInventoryClient,
    IMiscItem,
    InventorySlot
} from "@/src/types/inventoryTypes/inventoryTypes";
import { ExportMisc } from "warframe-public-export-plus";
import { getRecipe } from "@/src/services/itemDataService";
import { toMongoDate, version_compare } from "@/src/helpers/inventoryHelpers";
import { logger } from "@/src/utils/logger";
import { colorToShard } from "@/src/helpers/shardHelper";
import {
    addInfestedFoundryXP,
    applyCheatsToInfestedFoundry,
    handleSubsumeCompletion
} from "@/src/services/infestedFoundryService";

export const infestedFoundryController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    switch (req.query.mode) {
        case "s": {
            // shard installation
            const request = getJSONfromString<IShardInstallRequest>(String(req.body));
            const inventory = await getInventory(account._id.toString());
            const suit = inventory.Suits.id(request.SuitId.$oid)!;
            suit.ArchonCrystalUpgrades ??= [];
            while (suit.ArchonCrystalUpgrades.length < request.Slot) {
                suit.ArchonCrystalUpgrades.push({});
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
            const request = getJSONfromString<IShardUninstallRequest>(String(req.body));
            const inventory = await getInventory(account._id.toString());
            const suit = inventory.Suits.id(request.SuitId.$oid)!;

            const miscItemChanges: IMiscItem[] = [];
            if (suit.ArchonCrystalUpgrades![request.Slot].Color) {
                // refund shard
                const shard = Object.entries(colorToShard).find(
                    ([color]) => color == suit.ArchonCrystalUpgrades![request.Slot].Color
                )![1];
                miscItemChanges.push({
                    ItemType: shard,
                    ItemCount: 1
                });
                addMiscItems(inventory, miscItemChanges);

                // consume resources
                if (!inventory.infiniteHelminthMaterials) {
                    let type: string;
                    let count: number;
                    if (account.BuildLabel && version_compare(account.BuildLabel, "2025.05.20.10.18") < 0) {
                        // < 38.6.0
                        type = "/Lotus/Types/Items/InfestedFoundry/HelminthBile";
                        count = 300;
                    } else {
                        // >= 38.6.0
                        type =
                            archonCrystalRemovalResource[
                                suit.ArchonCrystalUpgrades![request.Slot].Color!.replace("_MYTHIC", "")
                            ];
                        count = suit.ArchonCrystalUpgrades![request.Slot].Color!.indexOf("_MYTHIC") != -1 ? 300 : 150;
                    }
                    inventory.InfestedFoundry!.Resources!.find(x => x.ItemType == type)!.Count -= count;
                }
            }

            // remove from suit
            suit.ArchonCrystalUpgrades![request.Slot].UpgradeType = undefined;
            suit.ArchonCrystalUpgrades![request.Slot].Color = undefined;

            await inventory.save();

            const infestedFoundry = inventory.toJSON<IInventoryClient>().InfestedFoundry!;
            applyCheatsToInfestedFoundry(inventory, infestedFoundry);
            res.json({
                InventoryChanges: {
                    MiscItems: miscItemChanges,
                    InfestedFoundry: infestedFoundry
                }
            });
            break;
        }

        case "n": {
            // name the beast
            const request = getJSONfromString<IHelminthNameRequest>(String(req.body));
            const inventory = await getInventory(account._id.toString());
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

            const inventory = await getInventory(account._id.toString());

            if (inventory.infiniteHelminthMaterials) {
                res.status(400).end();
                return;
            }

            const request = getJSONfromString<IHelminthFeedRequest>(String(req.body));
            inventory.InfestedFoundry ??= {};
            inventory.InfestedFoundry.Resources ??= [];

            const miscItemChanges: IMiscItem[] = [];
            let totalPercentagePointsGained = 0;

            const currentUnixSeconds = Math.trunc(Date.now() / 1000);

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
                if (resource.Count > 1000) resource.Count = 1000;
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
            const request = getJSONfromString<IHelminthOfferingsUpdate>(String(req.body));
            const inventory = await getInventory(account._id.toString());
            inventory.InfestedFoundry ??= {};
            inventory.InfestedFoundry.InvigorationIndex = request.OfferingsIndex;
            inventory.InfestedFoundry.InvigorationSuitOfferings = request.SuitTypes;
            if (request.Extra) {
                inventory.InfestedFoundry.InvigorationsApplied = 0;
            }
            await inventory.save();
            const infestedFoundry = inventory.toJSON<IInventoryClient>().InfestedFoundry!;
            applyCheatsToInfestedFoundry(inventory, infestedFoundry);
            res.json({
                InventoryChanges: {
                    InfestedFoundry: infestedFoundry
                }
            });
            break;
        }

        case "a": {
            // subsume warframe
            const request = getJSONfromString<IHelminthSubsumeRequest>(String(req.body));
            const inventory = await getInventory(account._id.toString());
            const recipe = getRecipe(request.Recipe)!;
            if (!inventory.infiniteHelminthMaterials) {
                for (const ingredient of recipe.secretIngredients!) {
                    const resource = inventory.InfestedFoundry!.Resources!.find(x => x.ItemType == ingredient.ItemType);
                    if (resource) {
                        resource.Count -= ingredient.ItemCount;
                    }
                }
            }
            const suit = inventory.Suits.id(request.SuitId.$oid)!;
            inventory.Suits.pull(suit);
            const consumedSuit: IConsumedSuit = { s: suit.ItemType };
            if (suit.Configs[0] && suit.Configs[0].pricol) {
                consumedSuit.c = suit.Configs[0].pricol;
            }
            if ((inventory.InfestedFoundry!.XP ?? 0) < 73125_00) {
                inventory.InfestedFoundry!.Slots!--;
            }
            inventory.InfestedFoundry!.ConsumedSuits ??= [];
            inventory.InfestedFoundry!.ConsumedSuits.push(consumedSuit);
            inventory.InfestedFoundry!.LastConsumedSuit = suit;
            inventory.InfestedFoundry!.AbilityOverrideUnlockCooldown = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const recipeChanges = addInfestedFoundryXP(inventory.InfestedFoundry!, 1600_00);
            addRecipes(inventory, recipeChanges);
            freeUpSlot(inventory, InventorySlot.SUITS);
            await inventory.save();
            const infestedFoundry = inventory.toJSON<IInventoryClient>().InfestedFoundry!;
            applyCheatsToInfestedFoundry(inventory, infestedFoundry);
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
                    InfestedFoundry: infestedFoundry
                }
            });
            break;
        }

        case "r": {
            // rush subsume
            const inventory = await getInventory(account._id.toString());
            const currencyChanges = updateCurrency(inventory, 50, true);
            const recipeChanges = handleSubsumeCompletion(inventory);
            await inventory.save();
            const infestedFoundry = inventory.toJSON<IInventoryClient>().InfestedFoundry!;
            applyCheatsToInfestedFoundry(inventory, infestedFoundry);
            res.json({
                InventoryChanges: {
                    ...currencyChanges,
                    Recipes: recipeChanges,
                    InfestedFoundry: infestedFoundry
                }
            });
            break;
        }

        case "u": {
            const request = getJSONfromString<IHelminthInvigorationRequest>(String(req.body));
            const inventory = await getInventory(account._id.toString());
            const suit = inventory.Suits.id(request.SuitId.$oid)!;
            const upgradesExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            suit.OffensiveUpgrade = request.OffensiveUpgradeType;
            suit.DefensiveUpgrade = request.DefensiveUpgradeType;
            suit.UpgradesExpiry = upgradesExpiry;
            const recipeChanges = addInfestedFoundryXP(inventory.InfestedFoundry!, 4800_00);
            addRecipes(inventory, recipeChanges);
            if (!inventory.infiniteHelminthMaterials) {
                for (let i = 0; i != request.ResourceTypes.length; ++i) {
                    inventory.InfestedFoundry!.Resources!.find(x => x.ItemType == request.ResourceTypes[i])!.Count -=
                        request.ResourceCosts[i];
                }
            }
            inventory.InfestedFoundry!.InvigorationsApplied ??= 0;
            inventory.InfestedFoundry!.InvigorationsApplied += 1;
            await inventory.save();
            const infestedFoundry = inventory.toJSON<IInventoryClient>().InfestedFoundry!;
            applyCheatsToInfestedFoundry(inventory, infestedFoundry);
            res.json({
                SuitId: request.SuitId,
                OffensiveUpgrade: request.OffensiveUpgradeType,
                DefensiveUpgrade: request.DefensiveUpgradeType,
                UpgradesExpiry: toMongoDate(upgradesExpiry),
                InventoryChanges: {
                    Recipes: recipeChanges,
                    InfestedFoundry: infestedFoundry
                }
            });
            break;
        }

        case "custom_unlockall": {
            const inventory = await getInventory(account._id.toString());
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
            logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
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

interface IHelminthSubsumeRequest {
    SuitId: IOid;
    Recipe: string;
}

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

const archonCrystalRemovalResource: Record<string, string> = {
    ACC_RED: "/Lotus/Types/Items/InfestedFoundry/HelminthOxides",
    ACC_YELLOW: "/Lotus/Types/Items/InfestedFoundry/HelminthBile",
    ACC_BLUE: "/Lotus/Types/Items/InfestedFoundry/HelminthSynthetics",
    ACC_GREEN: "/Lotus/Types/Items/InfestedFoundry/HelminthBiotics",
    ACC_ORANGE: "/Lotus/Types/Items/InfestedFoundry/HelminthPheromones",
    ACC_PURPLE: "/Lotus/Types/Items/InfestedFoundry/HelminthCalx"
};
