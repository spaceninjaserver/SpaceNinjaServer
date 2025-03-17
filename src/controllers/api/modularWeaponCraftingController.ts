import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import {
    getInventory,
    updateCurrency,
    addEquipment,
    addMiscItems,
    applyDefaultUpgrades,
    occupySlot,
    productCategoryToInventoryBin
} from "@/src/services/inventoryService";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { getDefaultUpgrades } from "@/src/services/itemDataService";
import { modularWeaponTypes } from "@/src/helpers/modularWeaponHelper";

interface IModularCraftRequest {
    WeaponType: string;
    Parts: string[];
}

export const modularWeaponCraftingController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString<IModularCraftRequest>(String(req.body));
    if (!(data.WeaponType in modularWeaponTypes)) {
        throw new Error(`unknown modular weapon type: ${data.WeaponType}`);
    }
    const category = modularWeaponTypes[data.WeaponType];
    const inventory = await getInventory(accountId);

    const defaultUpgrades = getDefaultUpgrades(data.Parts);
    const configs = applyDefaultUpgrades(inventory, defaultUpgrades);
    const inventoryChanges: IInventoryChanges = {
        ...addEquipment(inventory, category, data.WeaponType, data.Parts, {}, { Configs: configs }),
        ...occupySlot(inventory, productCategoryToInventoryBin(category)!, false)
    };
    if (defaultUpgrades) {
        inventoryChanges.RawUpgrades = defaultUpgrades.map(x => ({ ItemType: x.ItemType, ItemCount: 1 }));
    }

    // Remove credits & parts
    const miscItemChanges = [];
    for (const part of data.Parts) {
        miscItemChanges.push({
            ItemType: part,
            ItemCount: -1
        });
    }
    const currencyChanges = updateCurrency(
        inventory,
        category == "Hoverboards" || category == "MoaPets" || category == "LongGuns" || category == "Pistols"
            ? 5000
            : 4000, // Definitely correct for Melee & OperatorAmps
        false
    );
    addMiscItems(inventory, miscItemChanges);
    await inventory.save();

    // Tell client what we did
    res.json({
        InventoryChanges: {
            ...inventoryChanges,
            ...currencyChanges,
            MiscItems: miscItemChanges
        }
    });
};
