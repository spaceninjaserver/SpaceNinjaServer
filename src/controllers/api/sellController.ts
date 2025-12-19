import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import {
    getInventory,
    addMods,
    addRecipes,
    addMiscItems,
    addConsumables,
    freeUpSlot,
    combineInventoryChanges,
    addCrewShipRawSalvage,
    addFusionPoints,
    addCrewShipFusionPoints,
    addFusionTreasures
} from "../../services/inventoryService.ts";
import { InventorySlot } from "../../types/inventoryTypes/inventoryTypes.ts";
import { ExportDojoRecipes } from "warframe-public-export-plus";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import type { TInventoryDatabaseDocument } from "../../models/inventoryModels/inventoryModel.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import { parseFusionTreasure, toOid } from "../../helpers/inventoryHelpers.ts";
import { logger } from "../../utils/logger.ts";

export const sellController: RequestHandler = async (req, res) => {
    const payload = JSON.parse(String(req.body)) as ISellRequest;
    //console.log(JSON.stringify(payload, null, 2));
    const accountId = await getAccountIdForRequest(req);
    const requiredFields = new Set<keyof TInventoryDatabaseDocument>();
    let sellCurrency = "SC_RegularCredits";
    if (payload.SellCurrency) {
        sellCurrency = payload.SellCurrency;
    } else {
        if (payload.SellForFusionPoints || payload.SellForPrimeBucks) {
            if (payload.SellForFusionPoints) {
                sellCurrency = "SC_FusionPoints";
            }
            if (payload.SellForPrimeBucks) {
                sellCurrency = "SC_PrimeBucks";
            }
        }
    }
    if (sellCurrency == "SC_RegularCredits") {
        requiredFields.add("RegularCredits");
    } else if (sellCurrency == "SC_FusionPoints") {
        requiredFields.add("FusionPoints");
    } else if (sellCurrency == "SC_CrewShipFusionPoints") {
        requiredFields.add("CrewShipFusionPoints");
    } else {
        requiredFields.add("MiscItems");
    }
    for (const key of Object.keys(payload.Items)) {
        requiredFields.add(key as keyof TInventoryDatabaseDocument);
        if (key == "LongGuns") {
            requiredFields.add("Melee");
        }
    }
    if (requiredFields.has("Upgrades")) {
        requiredFields.add("RawUpgrades");
    }
    if ("Suits" in payload.Items) {
        requiredFields.add(InventorySlot.SUITS);
    }
    if ("LongGuns" in payload.Items || "Pistols" in payload.Items || "Melee" in payload.Items) {
        requiredFields.add(InventorySlot.WEAPONS);
    }
    if ("SpaceSuits" in payload.Items) {
        requiredFields.add(InventorySlot.SPACESUITS);
    }
    if ("SpaceGuns" in payload.Items || "SpaceMelee" in payload.Items) {
        requiredFields.add(InventorySlot.SPACEWEAPONS);
    }
    if ("MechSuits" in payload.Items) {
        requiredFields.add(InventorySlot.MECHSUITS);
    }
    if ("Sentinels" in payload.Items || "SentinelWeapons" in payload.Items || "MoaPets" in payload.Items) {
        requiredFields.add(InventorySlot.SENTINELS);
    }
    if ("OperatorAmps" in payload.Items) {
        requiredFields.add(InventorySlot.AMPS);
    }
    if ("Hoverboards" in payload.Items) {
        requiredFields.add(InventorySlot.SPACESUITS);
    }
    if ("CrewMembers" in payload.Items) {
        requiredFields.add(InventorySlot.CREWMEMBERS);
    }
    if ("CrewShipWeapons" in payload.Items || "CrewShipWeaponSkins" in payload.Items) {
        requiredFields.add(InventorySlot.RJ_COMPONENT_AND_ARMAMENTS);
        requiredFields.add("CrewShipRawSalvage");
        if ("CrewShipWeapons" in payload.Items) {
            requiredFields.add("CrewShipSalvagedWeapons");
        }
        if ("CrewShipWeaponSkins" in payload.Items) {
            requiredFields.add("CrewShipSalvagedWeaponSkins");
        }
    }
    if ("WeaponSkins" in payload.Items) {
        requiredFields.add("WeaponSkins");
    }
    const inventory = await getInventory(accountId, Array.from(requiredFields).join(" "));

    // Give currency
    if (sellCurrency == "SC_RegularCredits") {
        inventory.RegularCredits += payload.SellPrice;
    } else if (sellCurrency == "SC_FusionPoints") {
        addFusionPoints(inventory, payload.SellPrice);
    } else if (sellCurrency == "SC_CrewShipFusionPoints") {
        addCrewShipFusionPoints(inventory, payload.SellPrice);
    } else if (sellCurrency == "SC_PrimeBucks") {
        addMiscItems(inventory, [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/PrimeBucks",
                ItemCount: payload.SellPrice
            }
        ]);
    } else if (sellCurrency == "SC_DistillPoints") {
        addMiscItems(inventory, [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/DistillPoints",
                ItemCount: payload.SellPrice
            }
        ]);
    } else if (sellCurrency == "SC_Resources") {
        // Will add appropriate MiscItems from CrewShipWeapons or CrewShipWeaponSkins
    } else {
        throw new Error("Unknown SellCurrency: " + payload.SellCurrency);
    }

    const inventoryChanges: IInventoryChanges = {};

    // Remove item(s)
    for (const key in payload.Items) {
        switch (key) {
            case "Suits":
                payload.Items.Suits.forEach(sellItem => {
                    inventory.Suits.pull({ _id: sellItem.String });
                    freeUpSlot(inventory, InventorySlot.SUITS);
                });
                break;
            case "LongGuns":
                payload.Items.LongGuns.forEach(sellItem => {
                    const item = inventory.LongGuns.id(sellItem.String)!;
                    if (item.AltWeaponModeId) {
                        inventory.Melee.pull({ _id: item.AltWeaponModeId });
                        freeUpSlot(inventory, InventorySlot.WEAPONS);
                        inventoryChanges.RemovedIdItems ??= [];
                        inventoryChanges.RemovedIdItems.push({ ItemId: toOid(item.AltWeaponModeId) });
                    }
                    inventory.LongGuns.pull({ _id: sellItem.String });
                    freeUpSlot(inventory, InventorySlot.WEAPONS);
                });
                break;
            case "Pistols":
                payload.Items.Pistols.forEach(sellItem => {
                    inventory.Pistols.pull({ _id: sellItem.String });
                    freeUpSlot(inventory, InventorySlot.WEAPONS);
                });
                break;
            case "Melee":
                payload.Items.Melee.forEach(sellItem => {
                    inventory.Melee.pull({ _id: sellItem.String });
                    freeUpSlot(inventory, InventorySlot.WEAPONS);
                });
                break;
            case "SpaceSuits":
                payload.Items.SpaceSuits.forEach(sellItem => {
                    inventory.SpaceSuits.pull({ _id: sellItem.String });
                    freeUpSlot(inventory, InventorySlot.SPACESUITS);
                });
                break;
            case "SpaceGuns":
                payload.Items.SpaceGuns.forEach(sellItem => {
                    inventory.SpaceGuns.pull({ _id: sellItem.String });
                    freeUpSlot(inventory, InventorySlot.SPACEWEAPONS);
                });
                break;
            case "SpaceMelee":
                payload.Items.SpaceMelee.forEach(sellItem => {
                    inventory.SpaceMelee.pull({ _id: sellItem.String });
                    freeUpSlot(inventory, InventorySlot.SPACEWEAPONS);
                });
                break;
            case "MechSuits":
                payload.Items.MechSuits.forEach(sellItem => {
                    inventory.MechSuits.pull({ _id: sellItem.String });
                    freeUpSlot(inventory, InventorySlot.MECHSUITS);
                });
                break;
            case "Sentinels":
                payload.Items.Sentinels.forEach(sellItem => {
                    inventory.Sentinels.pull({ _id: sellItem.String });
                    freeUpSlot(inventory, InventorySlot.SENTINELS);
                });
                break;
            case "SentinelWeapons":
                payload.Items.SentinelWeapons.forEach(sellItem => {
                    inventory.SentinelWeapons.pull({ _id: sellItem.String });
                    freeUpSlot(inventory, InventorySlot.SENTINELS);
                });
                break;
            case "MoaPets":
                payload.Items.MoaPets.forEach(sellItem => {
                    inventory.MoaPets.pull({ _id: sellItem.String });
                    freeUpSlot(inventory, InventorySlot.SENTINELS);
                });
                break;
            case "OperatorAmps":
                payload.Items.OperatorAmps.forEach(sellItem => {
                    inventory.OperatorAmps.pull({ _id: sellItem.String });
                    freeUpSlot(inventory, InventorySlot.AMPS);
                });
                break;
            case "Hoverboards":
                payload.Items.Hoverboards.forEach(sellItem => {
                    inventory.Hoverboards.pull({ _id: sellItem.String });
                    freeUpSlot(inventory, InventorySlot.SPACESUITS);
                });
                break;
            case "Drones":
                payload.Items.Drones.forEach(sellItem => {
                    inventory.Drones.pull({ _id: sellItem.String });
                });
                break;
            case "KubrowPetPrints":
                payload.Items.KubrowPetPrints.forEach(sellItem => {
                    inventory.KubrowPetPrints.pull({ _id: sellItem.String });
                });
                break;
            case "CrewMembers":
                payload.Items.CrewMembers.forEach(sellItem => {
                    inventory.CrewMembers.pull({ _id: sellItem.String });
                    freeUpSlot(inventory, InventorySlot.CREWMEMBERS);
                });
                break;
            case "CrewShipWeapons":
                payload.Items.CrewShipWeapons.forEach(sellItem => {
                    if (sellItem.String[0] == "/") {
                        addCrewShipRawSalvage(inventory, [
                            {
                                ItemType: sellItem.String,
                                ItemCount: sellItem.Count * -1
                            }
                        ]);
                    } else {
                        const index = inventory.CrewShipWeapons.findIndex(x => x._id.equals(sellItem.String));
                        if (index != -1) {
                            if (sellCurrency == "SC_Resources") {
                                refundPartialBuildCosts(
                                    inventory,
                                    inventory.CrewShipWeapons[index].ItemType,
                                    inventoryChanges
                                );
                            }
                            inventory.CrewShipWeapons.splice(index, 1);
                            freeUpSlot(inventory, InventorySlot.RJ_COMPONENT_AND_ARMAMENTS);
                        } else {
                            inventory.CrewShipSalvagedWeapons.pull({ _id: sellItem.String });
                        }
                    }
                });
                break;
            case "CrewShipWeaponSkins":
                payload.Items.CrewShipWeaponSkins.forEach(sellItem => {
                    if (sellItem.String[0] == "/") {
                        addCrewShipRawSalvage(inventory, [
                            {
                                ItemType: sellItem.String,
                                ItemCount: sellItem.Count * -1
                            }
                        ]);
                    } else {
                        const index = inventory.CrewShipWeaponSkins.findIndex(x => x._id.equals(sellItem.String));
                        if (index != -1) {
                            if (sellCurrency == "SC_Resources") {
                                refundPartialBuildCosts(
                                    inventory,
                                    inventory.CrewShipWeaponSkins[index].ItemType,
                                    inventoryChanges
                                );
                            }
                            inventory.CrewShipWeaponSkins.splice(index, 1);
                            freeUpSlot(inventory, InventorySlot.RJ_COMPONENT_AND_ARMAMENTS);
                        } else {
                            inventory.CrewShipSalvagedWeaponSkins.pull({ _id: sellItem.String });
                        }
                    }
                });
                break;
            case "Consumables":
                {
                    const consumablesChanges = [];
                    for (const sellItem of payload.Items.Consumables) {
                        consumablesChanges.push({
                            ItemType: sellItem.String,
                            ItemCount: sellItem.Count * -1
                        });
                    }
                    addConsumables(inventory, consumablesChanges);
                }
                break;
            case "Recipes":
                {
                    const recipeChanges = [];
                    for (const sellItem of payload.Items.Recipes) {
                        recipeChanges.push({
                            ItemType: sellItem.String,
                            ItemCount: sellItem.Count * -1
                        });
                    }
                    addRecipes(inventory, recipeChanges);
                }
                break;
            case "Upgrades":
                payload.Items.Upgrades.forEach(sellItem => {
                    if (sellItem.Count == 0) {
                        inventory.Upgrades.pull({ _id: sellItem.String });
                    } else {
                        addMods(inventory, [
                            {
                                ItemType: sellItem.String,
                                ItemCount: sellItem.Count * -1
                            }
                        ]);
                    }
                });
                break;
            case "MiscItems":
                payload.Items.MiscItems.forEach(sellItem => {
                    addMiscItems(inventory, [
                        {
                            ItemType: sellItem.String,
                            ItemCount: sellItem.Count * -1
                        }
                    ]);
                });
                break;
            case "FusionTreasures":
                payload.Items.FusionTreasures.forEach(sellItem => {
                    addFusionTreasures(inventory, [parseFusionTreasure(sellItem.String, sellItem.Count * -1)]);
                });
                break;
            case "WeaponSkins": // SNS specific field, only used by webui
                payload.Items.WeaponSkins.forEach(sellItem => {
                    inventory.WeaponSkins.pull({ _id: sellItem.String });
                });
                break;
            default:
                logger.warn(`unhandled sell category: ${key}`);
        }
    }

    await inventory.save();
    res.json({
        inventoryChanges: inventoryChanges // "inventoryChanges" for this response instead of the usual "InventoryChanges"
    });
    broadcastInventoryUpdate(req);
};

interface ISellRequest {
    Items: Record<string, ISellItem[]>;
    SellPrice: number;
    SellCurrency?:
        | "SC_RegularCredits"
        | "SC_PrimeBucks"
        | "SC_FusionPoints"
        | "SC_DistillPoints"
        | "SC_CrewShipFusionPoints"
        | "SC_Resources"
        | "somethingelsewemightnotknowabout";
    buildLabel: string;
    // These are used in old builds (undetermined where it changed) instead of SellCurrency
    SellForPrimeBucks?: boolean;
    SellForFusionPoints?: boolean;
}

interface ISellItem {
    String: string; // oid or uniqueName
    Count: number;
}

const refundPartialBuildCosts = (
    inventory: TInventoryDatabaseDocument,
    itemType: string,
    inventoryChanges: IInventoryChanges
): void => {
    // House versions
    const research = Object.values(ExportDojoRecipes.research).find(x => x.resultType == itemType);
    if (research) {
        const miscItemChanges = research.ingredients.map(x => ({
            ItemType: x.ItemType,
            ItemCount: Math.trunc(x.ItemCount * 0.8)
        }));
        addMiscItems(inventory, miscItemChanges);
        combineInventoryChanges(inventoryChanges, { MiscItems: miscItemChanges });
        return;
    }

    // Sigma versions
    const recipe = Object.values(ExportDojoRecipes.fabrications).find(x => x.resultType == itemType);
    if (recipe) {
        const miscItemChanges = recipe.ingredients.map(x => ({
            ItemType: x.ItemType,
            ItemCount: Math.trunc(x.ItemCount * 0.8)
        }));
        addMiscItems(inventory, miscItemChanges);
        combineInventoryChanges(inventoryChanges, { MiscItems: miscItemChanges });
        return;
    }
};
