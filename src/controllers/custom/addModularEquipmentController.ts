import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory, addEquipment, occupySlot, productCategoryToInventoryBin } from "@/src/services/inventoryService";
import { modularWeaponTypes } from "@/src/helpers/modularWeaponHelper";
import { ExportWeapons } from "warframe-public-export-plus";
import { RequestHandler } from "express";

export const addModularEquipmentController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = req.body as IAddModularEquipmentRequest;
    const category = modularWeaponTypes[request.ItemType];
    const inventoryBin = productCategoryToInventoryBin(category)!;
    const inventory = await getInventory(accountId, `${category} ${inventoryBin}`);
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
        }
    });
    addEquipment(inventory, category, request.ItemType, request.ModularParts);
    occupySlot(inventory, inventoryBin, true);
    await inventory.save();
    res.end();
};

interface IAddModularEquipmentRequest {
    ItemType: string;
    ModularParts: string[];
}
