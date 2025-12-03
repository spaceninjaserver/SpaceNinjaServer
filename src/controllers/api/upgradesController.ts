import type { RequestHandler } from "express";
import { fromOid, version_compare } from "../../helpers/inventoryHelpers.ts";
import type { IUpgradesRequest, IUpgradesRequestLegacy } from "../../types/requestTypes.ts";
import type { ArtifactPolarity, IAbilityOverride } from "../../types/inventoryTypes/commonInventoryTypes.ts";
import type { IInventoryClient, IMiscItem } from "../../types/inventoryTypes/inventoryTypes.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { addMiscItems, addMods, addRecipes, getInventory, updateCurrency } from "../../services/inventoryService.ts";
import { getRecipeByResult } from "../../services/itemDataService.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import { addInfestedFoundryXP, applyCheatsToInfestedFoundry } from "../../services/infestedFoundryService.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";
import type { IEquipmentDatabase } from "../../types/equipmentTypes.ts";
import { EquipmentFeatures } from "../../types/equipmentTypes.ts";
import { Types } from "mongoose";
import gameToBuildVersion from "../../../static/fixed_responses/gameToBuildVersion.json" with { type: "json" };

export const upgradesController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const accountId = account._id.toString();
    const inventory = await getInventory(accountId);
    const inventoryChanges: IInventoryChanges = {};

    if (account.BuildLabel && version_compare(account.BuildLabel, gameToBuildVersion["24.4.0"]) < 0) {
        // Builds before U24.4.0 have a different request format
        const payload = JSON.parse(String(req.body)) as IUpgradesRequestLegacy;
        const itemId = fromOid(payload.Weapon.ItemId);
        if (itemId) {
            if (payload.IsSwappingOperation === true) {
                const item = inventory[payload.Category].id(itemId)!;
                for (let i = 0; i != payload.PolarityRemap.length; ++i) {
                    // Can't really be selective here like the newer format, it pushes everything in a way that the comparison fails against...
                    setSlotPolarity(item, i, payload.PolarityRemap[i].Value);
                }
            } else {
                if (payload.PolarizeReq) {
                    switch (payload.PolarizeReq) {
                        case "/Lotus/Types/Items/MiscItems/Forma":
                        case "/Lotus/Types/Items/MiscItems/FormaUmbra": {
                            const item = inventory[payload.Category].id(itemId)!;
                            item.XP = 0;
                            setSlotPolarity(item, payload.PolarizeSlot, payload.PolarizeValue);
                            item.Polarized ??= 0;
                            item.Polarized += 1;
                            sendWsBroadcastTo(accountId, { update_inventory: true });
                            break;
                        }
                        default:
                            throw new Error("Unsupported polarize item: " + payload.PolarizeReq);
                    }
                    addMiscItems(inventory, [
                        {
                            ItemType: payload.PolarizeReq,
                            ItemCount: -1
                        } satisfies IMiscItem
                    ]);
                }
                if (payload.UtilityReq) {
                    switch (payload.UtilityReq) {
                        case "/Lotus/Types/Items/MiscItems/UtilityUnlocker": {
                            const item = inventory[payload.Category].id(itemId)!;
                            item.Features ??= 0;
                            item.Features |= EquipmentFeatures.UTILITY_SLOT;
                            break;
                        }
                        default:
                            throw new Error("Unsupported utility item: " + payload.UtilityReq);
                    }
                    addMiscItems(inventory, [
                        {
                            ItemType: payload.UtilityReq,
                            ItemCount: -1
                        } satisfies IMiscItem
                    ]);
                }
                if (payload.UpgradeReq) {
                    switch (payload.UpgradeReq) {
                        case "/Lotus/Types/Items/MiscItems/OrokinReactor":
                        case "/Lotus/Types/Items/MiscItems/OrokinCatalyst": {
                            const item = inventory[payload.Category].id(itemId)!;
                            item.Features ??= 0;
                            item.Features |= EquipmentFeatures.DOUBLE_CAPACITY;
                            break;
                        }
                        default:
                            throw new Error("Unsupported upgrade: " + payload.UpgradeReq);
                    }
                    addMiscItems(inventory, [
                        {
                            ItemType: payload.UpgradeReq,
                            ItemCount: -1
                        } satisfies IMiscItem
                    ]);
                }
            }

            // Handle attaching/detaching mods in U7-U8
            if (payload.UpgradesToAttach && payload.UpgradesToAttach.length > 0) {
                const item = inventory[payload.Category].id(itemId)!;
                if (!item.Configs[0]) {
                    item.Configs.push({ Upgrades: ["", "", "", "", "", "", "", "", "", "", ""] });
                }
                if (item.Configs[0].Upgrades && item.Configs[0].Upgrades.length < 11) {
                    item.Configs[0].Upgrades.length = 11;
                }
                payload.UpgradesToAttach.forEach(upgrade => {
                    if (item.Configs[0].Upgrades && upgrade.ItemId.$id && upgrade.Slot) {
                        const arr = item.Configs[0].Upgrades;
                        if (arr.indexOf(upgrade.ItemId.$id) != -1) {
                            // Handle swapping mod to a different slot
                            arr[arr.indexOf(upgrade.ItemId.$id)] = "";
                        }
                        // We need to convert RawUpgrade into Upgrade once it's attached
                        const rawUpgrade = inventory.RawUpgrades.id(upgrade.ItemId.$id);
                        if (rawUpgrade) {
                            const newId = new Types.ObjectId().toString();
                            arr[upgrade.Slot - 1] = newId;
                            addMods(inventory, [
                                {
                                    ItemType: upgrade.ItemType,
                                    ItemCount: -1
                                }
                            ]);
                            inventory.Upgrades.push({
                                UpgradeFingerprint: `{"lvl":0}`,
                                ItemType: upgrade.ItemType,
                                _id: newId
                            });
                        } else {
                            arr[upgrade.Slot - 1] = upgrade.ItemId.$id;
                        }
                    }
                });
            }
            if (payload.UpgradesToDetach && payload.UpgradesToDetach.length > 0) {
                const item = inventory[payload.Category].id(itemId)!;
                if (item.Configs[0].Upgrades && item.Configs[0].Upgrades.length < 11) {
                    item.Configs[0].Upgrades.length = 11;
                }
                payload.UpgradesToDetach.forEach(upgrade => {
                    if (item.Configs[0].Upgrades && upgrade.ItemId.$id) {
                        const arr = item.Configs[0].Upgrades;
                        arr[arr.indexOf(upgrade.ItemId.$id)] = "";
                    }
                });
            }
        }
    } else {
        const payload = JSON.parse(String(req.body)) as IUpgradesRequest;
        for (const operation of payload.Operations) {
            if (
                operation.UpgradeRequirement == "/Lotus/Types/Items/MiscItems/ModSlotUnlocker" ||
                operation.UpgradeRequirement == "/Lotus/Types/Items/MiscItems/CustomizationSlotUnlocker"
            ) {
                updateCurrency(inventory, 10, true);
            } else if (
                operation.OperationType != "UOT_SWAP_POLARITY" &&
                operation.OperationType != "UOT_ABILITY_OVERRIDE"
            ) {
                if (!operation.UpgradeRequirement) {
                    throw new Error(`${operation.OperationType} operation should be free?`);
                }
                addMiscItems(inventory, [
                    {
                        ItemType: operation.UpgradeRequirement,
                        ItemCount: -1
                    } satisfies IMiscItem
                ]);
            }

            if (operation.OperationType == "UOT_ABILITY_OVERRIDE") {
                console.assert(payload.ItemCategory == "Suits");
                const suit = inventory.Suits.id(payload.ItemId.$oid)!;

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
                        if (!inventory.infiniteHelminthMaterials) {
                            inventory.InfestedFoundry!.Resources!.find(x => x.ItemType == ingredient.ItemType)!.Count -=
                                ingredient.ItemCount;
                        }
                    }
                }

                for (const entry of operation.PolarityRemap) {
                    suit.Configs[entry.Slot] ??= {};
                    suit.Configs[entry.Slot].AbilityOverride = newAbilityOverride;
                }

                const recipeChanges = addInfestedFoundryXP(
                    inventory.InfestedFoundry!,
                    totalPercentagePointsConsumed * 8
                );
                addRecipes(inventory, recipeChanges);

                inventoryChanges.Recipes = recipeChanges;
                inventoryChanges.InfestedFoundry = inventory.toJSON<IInventoryClient>().InfestedFoundry;
                applyCheatsToInfestedFoundry(inventory, inventoryChanges.InfestedFoundry!);
            } else
                switch (operation.UpgradeRequirement) {
                    case "/Lotus/Types/Items/MiscItems/OrokinReactor":
                    case "/Lotus/Types/Items/MiscItems/OrokinCatalyst": {
                        const item = inventory[payload.ItemCategory].id(payload.ItemId.$oid)!;
                        item.Features ??= 0;
                        item.Features |= EquipmentFeatures.DOUBLE_CAPACITY;
                        break;
                    }
                    case "/Lotus/Types/Items/MiscItems/UtilityUnlocker":
                    case "/Lotus/Types/Items/MiscItems/WeaponUtilityUnlocker": {
                        const item = inventory[payload.ItemCategory].id(payload.ItemId.$oid)!;
                        item.Features ??= 0;
                        item.Features |= EquipmentFeatures.UTILITY_SLOT;
                        break;
                    }
                    case "/Lotus/Types/Items/MiscItems/HeavyWeaponCatalyst": {
                        console.assert(payload.ItemCategory == "SpaceGuns");
                        const item = inventory[payload.ItemCategory].id(payload.ItemId.$oid)!;
                        item.Features ??= 0;
                        item.Features |= EquipmentFeatures.GRAVIMAG_INSTALLED;
                        break;
                    }
                    case "/Lotus/Types/Items/MiscItems/WeaponPrimaryArcaneUnlocker":
                    case "/Lotus/Types/Items/MiscItems/WeaponSecondaryArcaneUnlocker":
                    case "/Lotus/Types/Items/MiscItems/WeaponMeleeArcaneUnlocker":
                    case "/Lotus/Types/Items/MiscItems/WeaponAmpArcaneUnlocker":
                    case "/Lotus/Types/Items/MiscItems/WeaponArchGunArcaneUnlocker": {
                        const item = inventory[payload.ItemCategory].id(payload.ItemId.$oid)!;
                        item.Features ??= 0;
                        if (operation.OperationType == "UOT_ARCANE_UNLOCK_1") {
                            item.Features |= EquipmentFeatures.SECOND_ARCANE_SLOT;
                        } else {
                            item.Features |= EquipmentFeatures.ARCANE_SLOT;
                        }
                        break;
                    }
                    case "/Lotus/Types/Items/MiscItems/ValenceAdapter": {
                        const item = inventory[payload.ItemCategory].id(payload.ItemId.$oid)!;
                        item.Features ??= 0;
                        item.Features |= EquipmentFeatures.VALENCE_SWAP;
                        break;
                    }
                    case "/Lotus/Types/Items/MiscItems/Forma":
                    case "/Lotus/Types/Items/MiscItems/FormaUmbra":
                    case "/Lotus/Types/Items/MiscItems/FormaAura":
                    case "/Lotus/Types/Items/MiscItems/FormaStance": {
                        const item = inventory[payload.ItemCategory].id(payload.ItemId.$oid)!;
                        item.XP = 0;
                        setSlotPolarity(item, operation.PolarizeSlot, operation.PolarizeValue);
                        item.Polarized ??= 0;
                        item.Polarized += 1;
                        sendWsBroadcastTo(accountId, { update_inventory: true }); // webui may need to to re-add "max rank" button
                        break;
                    }
                    case "/Lotus/Types/Items/MiscItems/ModSlotUnlocker": {
                        const item = inventory[payload.ItemCategory].id(payload.ItemId.$oid)!;
                        item.ModSlotPurchases ??= 0;
                        item.ModSlotPurchases += 1;
                        break;
                    }
                    case "/Lotus/Types/Items/MiscItems/CustomizationSlotUnlocker": {
                        const item = inventory[payload.ItemCategory].id(payload.ItemId.$oid)!;
                        item.CustomizationSlotPurchases ??= 0;
                        item.CustomizationSlotPurchases += 1;
                        break;
                    }
                    case "": {
                        console.assert(operation.OperationType == "UOT_SWAP_POLARITY");
                        const item = inventory[payload.ItemCategory].id(payload.ItemId.$oid)!;
                        for (let i = 0; i != operation.PolarityRemap.length; ++i) {
                            if (operation.PolarityRemap[i].Slot != i) {
                                setSlotPolarity(item, i, operation.PolarityRemap[i].Value);
                            }
                        }
                        break;
                    }
                    default:
                        throw new Error("Unsupported upgrade: " + operation.UpgradeRequirement);
                }
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
