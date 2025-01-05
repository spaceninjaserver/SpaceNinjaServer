import { RequestHandler } from "express";
import { IUpgradesRequest } from "@/src/types/requestTypes";
import {
    ArtifactPolarity,
    IEquipmentDatabase,
    EquipmentFeatures,
    IAbilityOverride
} from "@/src/types/inventoryTypes/commonInventoryTypes";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addMiscItems, addRecipes, getInventory, updateCurrency } from "@/src/services/inventoryService";
import { getRecipeByResult } from "@/src/services/itemDataService";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { addInfestedFoundryXP } from "./infestedFoundryController";

export const upgradesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = JSON.parse(String(req.body)) as IUpgradesRequest;
    const inventory = await getInventory(accountId);
    const inventoryChanges: IInventoryChanges = {};
    for (const operation of payload.Operations) {
        if (
            operation.UpgradeRequirement == "/Lotus/Types/Items/MiscItems/ModSlotUnlocker" ||
            operation.UpgradeRequirement == "/Lotus/Types/Items/MiscItems/CustomizationSlotUnlocker"
        ) {
            updateCurrency(inventory, 10, true);
        } else {
            addMiscItems(inventory, [
                {
                    ItemType: operation.UpgradeRequirement,
                    ItemCount: -1
                } satisfies IMiscItem
            ]);
        }

        if (operation.OperationType == "UOT_ABILITY_OVERRIDE") {
            console.assert(payload.ItemCategory == "Suits");
            const suit = inventory.Suits.find(x => x._id.toString() == payload.ItemId.$oid)!;

            let newAbilityOverride: IAbilityOverride | undefined;
            let totalPercentagePointsConsumed = 0;
            if (operation.UpgradeRequirement != "") {
                newAbilityOverride = {
                    Ability: operation.UpgradeRequirement,
                    Index: operation.PolarizeSlot
                };

                const recipe = getRecipeByResult(operation.UpgradeRequirement)!;
                for (const ingredient of recipe.ingredients) {
                    totalPercentagePointsConsumed += ingredient.ItemCount / 10;
                    inventory.InfestedFoundry!.Resources!.find(x => x.ItemType == ingredient.ItemType)!.Count -=
                        ingredient.ItemCount;
                }
            }

            for (const entry of operation.PolarityRemap) {
                suit.Configs[entry.Slot] ??= {};
                suit.Configs[entry.Slot].AbilityOverride = newAbilityOverride;
            }

            const recipeChanges = addInfestedFoundryXP(inventory.InfestedFoundry!, totalPercentagePointsConsumed * 8);
            addRecipes(inventory, recipeChanges);

            inventoryChanges.Recipes = recipeChanges;
            inventoryChanges.InfestedFoundry = inventory.toJSON().InfestedFoundry;
        } else
            switch (operation.UpgradeRequirement) {
                case "/Lotus/Types/Items/MiscItems/OrokinReactor":
                case "/Lotus/Types/Items/MiscItems/OrokinCatalyst":
                    for (const item of inventory[payload.ItemCategory]) {
                        if (item._id.toString() == payload.ItemId.$oid) {
                            item.Features ??= 0;
                            item.Features |= EquipmentFeatures.DOUBLE_CAPACITY;
                            break;
                        }
                    }
                    break;
                case "/Lotus/Types/Items/MiscItems/UtilityUnlocker":
                case "/Lotus/Types/Items/MiscItems/WeaponUtilityUnlocker":
                    for (const item of inventory[payload.ItemCategory]) {
                        if (item._id.toString() == payload.ItemId.$oid) {
                            item.Features ??= 0;
                            item.Features |= EquipmentFeatures.UTILITY_SLOT;
                            break;
                        }
                    }
                    break;
                case "/Lotus/Types/Items/MiscItems/HeavyWeaponCatalyst":
                    console.assert(payload.ItemCategory == "SpaceGuns");
                    for (const item of inventory[payload.ItemCategory]) {
                        if (item._id.toString() == payload.ItemId.$oid) {
                            item.Features ??= 0;
                            item.Features |= EquipmentFeatures.GRAVIMAG_INSTALLED;
                            break;
                        }
                    }
                    break;
                case "/Lotus/Types/Items/MiscItems/WeaponPrimaryArcaneUnlocker":
                case "/Lotus/Types/Items/MiscItems/WeaponSecondaryArcaneUnlocker":
                case "/Lotus/Types/Items/MiscItems/WeaponMeleeArcaneUnlocker":
                case "/Lotus/Types/Items/MiscItems/WeaponAmpArcaneUnlocker":
                    for (const item of inventory[payload.ItemCategory]) {
                        if (item._id.toString() == payload.ItemId.$oid) {
                            item.Features ??= 0;
                            item.Features |= EquipmentFeatures.ARCANE_SLOT;
                            break;
                        }
                    }
                    break;
                case "/Lotus/Types/Items/MiscItems/Forma":
                case "/Lotus/Types/Items/MiscItems/FormaUmbra":
                case "/Lotus/Types/Items/MiscItems/FormaAura":
                case "/Lotus/Types/Items/MiscItems/FormaStance":
                    for (const item of inventory[payload.ItemCategory]) {
                        if (item._id.toString() == payload.ItemId.$oid) {
                            item.XP = 0;
                            setSlotPolarity(item, operation.PolarizeSlot, operation.PolarizeValue);
                            item.Polarized ??= 0;
                            item.Polarized += 1;
                            break;
                        }
                    }
                    break;
                case "/Lotus/Types/Items/MiscItems/ModSlotUnlocker":
                    for (const item of inventory[payload.ItemCategory]) {
                        if (item._id.toString() == payload.ItemId.$oid) {
                            item.ModSlotPurchases ??= 0;
                            item.ModSlotPurchases += 1;
                            break;
                        }
                    }
                    break;
                case "/Lotus/Types/Items/MiscItems/CustomizationSlotUnlocker":
                    for (const item of inventory[payload.ItemCategory]) {
                        if (item._id.toString() == payload.ItemId.$oid) {
                            item.CustomizationSlotPurchases ??= 0;
                            item.CustomizationSlotPurchases += 1;
                            break;
                        }
                    }
                    break;
                case "":
                    console.assert(operation.OperationType == "UOT_SWAP_POLARITY");
                    for (const item of inventory[payload.ItemCategory]) {
                        if (item._id.toString() == payload.ItemId.$oid) {
                            for (let i = 0; i != operation.PolarityRemap.length; ++i) {
                                if (operation.PolarityRemap[i].Slot != i) {
                                    setSlotPolarity(item, i, operation.PolarityRemap[i].Value);
                                }
                            }
                            break;
                        }
                    }
                    break;
                default:
                    throw new Error("Unsupported upgrade: " + operation.UpgradeRequirement);
            }
    }
    await inventory.save();
    res.json({ InventoryChanges: inventoryChanges });
};

const setSlotPolarity = (item: IEquipmentDatabase, slot: number, polarity: ArtifactPolarity): void => {
    item.Polarity ??= [];
    const entry = item.Polarity.find(entry => entry.Slot == slot);
    if (entry) {
        entry.Value = polarity;
    } else {
        item.Polarity.push({ Slot: slot, Value: polarity });
    }
};
