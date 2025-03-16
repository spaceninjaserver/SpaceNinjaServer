import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";
import {
    getInventory,
    updateCurrency,
    addEquipment,
    addMiscItems,
    applyDefaultUpgrades,
    occupySlot,
    productCategoryToInventoryBin
} from "@/src/services/inventoryService";
import { ExportWeapons } from "warframe-public-export-plus";
import { IInventoryChanges } from "@/src/types/purchaseTypes";

const modularWeaponTypes: Record<string, TEquipmentKey> = {
    "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimary": "LongGuns",
    "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryBeam": "LongGuns",
    "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryLauncher": "LongGuns",
    "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryShotgun": "LongGuns",
    "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimarySniper": "LongGuns",
    "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondary": "Pistols",
    "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryBeam": "Pistols",
    "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryShotgun": "Pistols",
    "/Lotus/Weapons/Ostron/Melee/LotusModularWeapon": "Melee",
    "/Lotus/Weapons/Sentients/OperatorAmplifiers/OperatorAmpWeapon": "OperatorAmps",
    "/Lotus/Types/Vehicles/Hoverboard/HoverboardSuit": "Hoverboards",
    "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetPowerSuit": "MoaPets",
    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetAPowerSuit": "MoaPets",
    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetBPowerSuit": "MoaPets",
    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetCPowerSuit": "MoaPets"
};

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

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const configs = applyDefaultUpgrades(inventory, ExportWeapons[data.Parts[0]]?.defaultUpgrades);

    // Give weapon
    const inventoryChanges: IInventoryChanges = {
        ...addEquipment(inventory, category, data.WeaponType, data.Parts, {}, { Configs: configs }),
        ...occupySlot(inventory, productCategoryToInventoryBin(category)!, false)
    };

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
