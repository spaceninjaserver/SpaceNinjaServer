import { ExportRecipes } from "warframe-public-export-plus";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import {
    IAccountCheats,
    IInfestedFoundryClient,
    IInfestedFoundryDatabase
} from "@/src/types/inventoryTypes/inventoryTypes";
import { addRecipes } from "@/src/services/inventoryService";
import { ITypeCount } from "@/src/types/commonTypes";

export const addInfestedFoundryXP = (infestedFoundry: IInfestedFoundryDatabase, delta: number): ITypeCount[] => {
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

export const applyCheatsToInfestedFoundry = (cheats: IAccountCheats, infestedFoundry: IInfestedFoundryClient): void => {
    if (cheats.infiniteHelminthMaterials) {
        infestedFoundry.Resources = [
            { ItemType: "/Lotus/Types/Items/InfestedFoundry/HelminthCalx", Count: 1000 },
            { ItemType: "/Lotus/Types/Items/InfestedFoundry/HelminthBiotics", Count: 1000 },
            { ItemType: "/Lotus/Types/Items/InfestedFoundry/HelminthSynthetics", Count: 1000 },
            { ItemType: "/Lotus/Types/Items/InfestedFoundry/HelminthPheromones", Count: 1000 },
            { ItemType: "/Lotus/Types/Items/InfestedFoundry/HelminthBile", Count: 1000 },
            { ItemType: "/Lotus/Types/Items/InfestedFoundry/HelminthOxides", Count: 1000 }
        ];
    }
};
