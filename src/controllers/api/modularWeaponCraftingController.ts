import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";
import { getInventory, updateCurrency, addEquipment, addMiscItems } from "@/src/services/inventoryService";

const modularWeaponTypes: Record<string, TEquipmentKey> = {
    "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryBeam": "LongGuns",
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

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const modularWeaponCraftingController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString(String(req.body)) as IModularCraftRequest;
    if (!(data.WeaponType in modularWeaponTypes)) {
        throw new Error(`unknown modular weapon type: ${data.WeaponType}`);
    }
    const category = modularWeaponTypes[data.WeaponType];

    // Give weapon
    const weapon = await addEquipment(category, data.WeaponType, accountId, data.Parts);

    // Remove credits
    const currencyChanges = await updateCurrency(
        category == "Hoverboards" || category == "MoaPets" ? 5000 : 4000,
        false,
        accountId
    );

    // Remove parts
    const miscItemChanges = [];
    for (const part of data.Parts) {
        miscItemChanges.push({
            ItemType: part,
            ItemCount: -1
        });
    }
    const inventory = await getInventory(accountId);
    addMiscItems(inventory, miscItemChanges);
    await inventory.save();

    // Tell client what we did
    res.json({
        InventoryChanges: {
            ...currencyChanges,
            [category]: [weapon],
            MiscItems: miscItemChanges
        }
    });
};
