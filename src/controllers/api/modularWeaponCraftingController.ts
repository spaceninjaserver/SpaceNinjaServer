import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";
import { getInventory, updateCurrency, addEquipment, addMiscItems } from "@/src/services/inventoryService";

const modularWeaponTypeToCategory = (type: string): TEquipmentKey | undefined => {
    if (type.indexOf("LotusModularPrimary") != -1) {
        return "LongGuns";
    }
    if (type.indexOf("LotusModularSecondary") != -1) {
        return "Pistols";
    }
    switch (type) {
        case "/Lotus/Weapons/Ostron/Melee/LotusModularWeapon":
            return "Melee";
        case "/Lotus/Weapons/Sentients/OperatorAmplifiers/OperatorAmpWeapon":
            return "OperatorAmps";
        case "/Lotus/Types/Vehicles/Hoverboard/HoverboardSuit":
            return "Hoverboards";
        case "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetPowerSuit":
            return "MoaPets";
        case "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetAPowerSuit":
            return "MoaPets";
        case "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetBPowerSuit":
            return "MoaPets";
        case "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetCPowerSuit":
            return "MoaPets";
    }
    return undefined;
};

interface IModularCraftRequest {
    WeaponType: string;
    Parts: string[];
}

export const modularWeaponCraftingController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString(String(req.body)) as IModularCraftRequest;
    const category = modularWeaponTypeToCategory(data.WeaponType);
    if (!category) {
        throw new Error(`unknown modular weapon type: ${data.WeaponType}`);
    }

    // Give weapon
    const weapon = await addEquipment(category, data.WeaponType, accountId, data.Parts);

    // Remove credits & parts
    const miscItemChanges = [];
    for (const part of data.Parts) {
        miscItemChanges.push({
            ItemType: part,
            ItemCount: -1
        });
    }
    const inventory = await getInventory(accountId);
    const currencyChanges = updateCurrency(
        inventory,
        category == "Hoverboards" || category == "MoaPets" ? 5000 : 4000,
        false
    );
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
