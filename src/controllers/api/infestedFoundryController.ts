import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory, addMiscItems, updateCurrency, addRecipes } from "@/src/services/inventoryService";
import { IOid } from "@/src/types/commonTypes";
import { IConsumedSuit, IInfestedFoundry, IMiscItem, ITypeCount } from "@/src/types/inventoryTypes/inventoryTypes";
import { ExportMisc, ExportRecipes } from "warframe-public-export-plus";
import { getRecipe } from "@/src/services/itemDataService";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { toMongoDate } from "@/src/helpers/inventoryHelpers";

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

            for (const contribution of request.ResourceContributions) {
                const snack = ExportMisc.helminthSnacks[contribution.ItemType];

                // Note: Currently ignoring loss of apetite
                totalPercentagePointsGained += snack.gain / 0.01;
                const resource = inventory.InfestedFoundry.Resources.find(x => x.ItemType == snack.type);
                if (resource) {
                    resource.Count += Math.trunc(snack.gain * 1000);
                } else {
                    inventory.InfestedFoundry.Resources.push({
                        ItemType: snack.type,
                        Count: Math.trunc(snack.gain * 1000)
                    });
                }

                // tally items for removal
                const change = miscItemChanges.find(x => x.ItemType == contribution.ItemType);
                if (change) {
                    change.ItemCount -= snack.count;
                } else {
                    miscItemChanges.push({ ItemType: contribution.ItemType, ItemCount: snack.count * -1 });
                }
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

const addInfestedFoundryXP = (infestedFoundry: IInfestedFoundry, delta: number): ITypeCount[] => {
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
