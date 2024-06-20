import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { WeaponTypeInternal } from "@/src/services/itemDataService";
import { getInventory, updateCurrency, addWeapon, addMiscItems } from "@/src/services/inventoryService";

const modularWeaponTypes: Record<string, WeaponTypeInternal> = {
    "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryBeam": "LongGuns",
    "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondary": "Pistols",
    "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryBeam": "Pistols",
    "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryShotgun": "Pistols",
    "/Lotus/Weapons/Ostron/Melee/LotusModularWeapon": "Melee",
    "/Lotus/Weapons/Sentients/OperatorAmplifiers/OperatorAmpWeapon": "OperatorAmps"
};

interface IModularCraftRequest {
    WeaponType: string;
    Parts: string[];
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const modularWeaponCraftingController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data: IModularCraftRequest = getJSONfromString(req.body.toString());
    if (!(data.WeaponType in modularWeaponTypes)) {
        throw new Error(`unknown modular weapon type: ${data.WeaponType}`);
    }
    const category = modularWeaponTypes[data.WeaponType];

    // Give weapon
    const weapon = await addWeapon(category, data.WeaponType, accountId, data.Parts);

    // Remove 4000 credits
    const currencyChanges = await updateCurrency(4000, false, accountId);

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
