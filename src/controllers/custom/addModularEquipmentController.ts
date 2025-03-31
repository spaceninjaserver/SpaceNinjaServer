import { getAccountIdForRequest } from "@/src/services/loginService";
import {
    getInventory,
    addEquipment,
    occupySlot,
    productCategoryToInventoryBin,
    applyDefaultUpgrades
} from "@/src/services/inventoryService";
import { modularWeaponTypes } from "@/src/helpers/modularWeaponHelper";
import { getDefaultUpgrades } from "@/src/services/itemDataService";
import { IEquipmentDatabase } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { ExportWeapons } from "warframe-public-export-plus";
import { RequestHandler } from "express";

export const addModularEquipmentController: RequestHandler = async (req, res) => {
    const requiredFields = new Set();
    const accountId = await getAccountIdForRequest(req);
    const request = req.body as IAddModularEquipmentRequest;
    const category = modularWeaponTypes[request.ItemType];
    const inventoryBin = productCategoryToInventoryBin(category)!;
    requiredFields.add(category);
    requiredFields.add(inventoryBin);

    request.ModularParts.forEach(part => {
        if (ExportWeapons[part].gunType) {
            if (category == "LongGuns") {
                request.ItemType = {
                    GT_RIFLE: "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimary",
                    GT_SHOTGUN: "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryShotgun",
                    GT_BEAM: "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryBeam"
                }[ExportWeapons[part].gunType];
            } else {
                request.ItemType = {
                    GT_RIFLE: "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondary",
                    GT_SHOTGUN: "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryShotgun",
                    GT_BEAM: "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryBeam"
                }[ExportWeapons[part].gunType];
            }
        } else if (request.ItemType == "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetPowerSuit") {
            if (part.includes("ZanukaPetPartHead")) {
                request.ItemType = {
                    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadA":
                        "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetAPowerSuit",
                    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadB":
                        "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetBPowerSuit",
                    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadC":
                        "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetCPowerSuit"
                }[part]!;
            }
        }
    });
    const defaultUpgrades = getDefaultUpgrades(request.ModularParts);
    if (defaultUpgrades) {
        requiredFields.add("RawUpgrades");
    }
    const defaultWeaponsMap: Record<string, string[]> = {
        "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetAPowerSuit": [
            "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetMeleeWeaponIP"
        ],
        "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetBPowerSuit": [
            "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetMeleeWeaponIS"
        ],
        "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetCPowerSuit": [
            "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetMeleeWeaponPS"
        ]
    };
    const defaultWeapons = defaultWeaponsMap[request.ItemType];
    if (defaultWeapons) {
        for (const defaultWeapon of defaultWeapons) {
            const category = ExportWeapons[defaultWeapon].productCategory;
            requiredFields.add(category);
            requiredFields.add(productCategoryToInventoryBin(category));
        }
    }

    const inventory = await getInventory(accountId, Array.from(requiredFields).join(" "));
    if (defaultWeapons) {
        for (const defaultWeapon of defaultWeapons) {
            const category = ExportWeapons[defaultWeapon].productCategory;
            addEquipment(inventory, category, defaultWeapon);
            occupySlot(inventory, productCategoryToInventoryBin(category)!, true);
        }
    }

    const defaultOverwrites: Partial<IEquipmentDatabase> = {
        Configs: applyDefaultUpgrades(inventory, defaultUpgrades)
    };

    addEquipment(inventory, category, request.ItemType, request.ModularParts, undefined, defaultOverwrites);
    occupySlot(inventory, inventoryBin, true);
    await inventory.save();
    res.end();
};

interface IAddModularEquipmentRequest {
    ItemType: string;
    ModularParts: string[];
}
