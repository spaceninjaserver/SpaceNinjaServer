import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { TEquipmentKey } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";

export const changeModularPartsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = req.body as IUpdateFingerPrintRequest;
    const inventory = await getInventory(accountId, request.category);
    const item = inventory[request.category].id(request.oid);
    if (item) {
        item.ModularParts = request.modularParts;

        request.modularParts.forEach(part => {
            const categoryMap = mapping[part];
            if (categoryMap && categoryMap[request.category]) {
                item.ItemType = categoryMap[request.category]!;
            }
        });
        await inventory.save();
    }
    res.end();
};

interface IUpdateFingerPrintRequest {
    category: TEquipmentKey;
    oid: string;
    modularParts: string[];
}

const mapping: Partial<Record<string, Partial<Record<TEquipmentKey, string>>>> = {
    "/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel/SUModularSecondaryBarrelAPart": {
        LongGuns: "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryShotgun",
        Pistols: "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryShotgun"
    },
    "/Lotus/Weapons/Infested/Pistols/InfKitGun/Barrels/InfBarrelEgg/InfModularBarrelEggPart": {
        LongGuns: "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryShotgun",
        Pistols: "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryShotgun"
    },
    "/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel/SUModularSecondaryBarrelBPart": {
        LongGuns: "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimary",
        Pistols: "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondary"
    },
    "/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel/SUModularSecondaryBarrelCPart": {
        LongGuns: "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimary",
        Pistols: "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondary"
    },
    "/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel/SUModularSecondaryBarrelDPart": {
        LongGuns: "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryBeam",
        Pistols: "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryBeam"
    },
    "/Lotus/Weapons/Infested/Pistols/InfKitGun/Barrels/InfBarrelBeam/InfModularBarrelBeamPart": {
        LongGuns: "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryBeam",
        Pistols: "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryBeam"
    },
    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadA": {
        MoaPets: "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetAPowerSuit"
    },
    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadB": {
        MoaPets: "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetBPowerSuit"
    },
    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadC": {
        MoaPets: "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetCPowerSuit"
    }
};
