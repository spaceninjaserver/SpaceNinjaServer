import { RequestHandler } from "express";
import { ExportWeapons } from "warframe-public-export-plus";
import { IMongoDate } from "@/src/types/commonTypes";
import { toMongoDate } from "@/src/helpers/inventoryHelpers";
import { CRng } from "@/src/services/rngService";

// op=SyncAll
export const modularWeaponSaleController: RequestHandler = (_req, res) => {
    const partTypeToParts: Record<string, string[]> = {};
    for (const [uniqueName, data] of Object.entries(ExportWeapons)) {
        if (data.partType) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            partTypeToParts[data.partType] ??= [];
            partTypeToParts[data.partType].push(uniqueName);
        }
    }

    const today: number = Math.trunc(Date.now() / 86400000);
    const kitgunIsPrimary: boolean = (today & 1) != 0;
    res.json({
        SaleInfos: [
            getModularWeaponSale(
                partTypeToParts,
                today,
                "Ostron",
                ["LWPT_HILT", "LWPT_BLADE", "LWPT_HILT_WEIGHT"],
                () => "/Lotus/Weapons/Ostron/Melee/LotusModularWeapon"
            ),
            getModularWeaponSale(
                partTypeToParts,
                today,
                "SolarisUnitedHoverboard",
                ["LWPT_HB_DECK", "LWPT_HB_ENGINE", "LWPT_HB_FRONT", "LWPT_HB_JET"],
                () => "/Lotus/Types/Vehicles/Hoverboard/HoverboardSuit"
            ),
            getModularWeaponSale(
                partTypeToParts,
                today,
                "SolarisUnitedMoaPet",
                ["LWPT_MOA_LEG", "LWPT_MOA_HEAD", "LWPT_MOA_ENGINE", "LWPT_MOA_PAYLOAD"],
                () => "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetPowerSuit"
            ),
            getModularWeaponSale(
                partTypeToParts,
                today,
                "SolarisUnitedKitGun",
                [
                    kitgunIsPrimary ? "LWPT_GUN_PRIMARY_HANDLE" : "LWPT_GUN_SECONDARY_HANDLE",
                    "LWPT_GUN_BARREL",
                    "LWPT_GUN_CLIP"
                ],
                (parts: string[]) => {
                    const barrel = parts[1];
                    const gunType = ExportWeapons[barrel].gunType!;
                    if (kitgunIsPrimary) {
                        return {
                            GT_RIFLE: "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimary",
                            GT_SHOTGUN: "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryShotgun",
                            GT_BEAM: "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryBeam"
                        }[gunType];
                    } else {
                        return {
                            GT_RIFLE: "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondary",
                            GT_SHOTGUN: "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryShotgun",
                            GT_BEAM: "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryBeam"
                        }[gunType];
                    }
                }
            )
        ]
    });
};

const priceFactor: Record<string, number> = {
    Ostron: 0.9,
    SolarisUnitedHoverboard: 0.85,
    SolarisUnitedMoaPet: 0.95,
    SolarisUnitedKitGun: 0.9
};

const getModularWeaponSale = (
    partTypeToParts: Record<string, string[]>,
    day: number,
    name: string,
    partTypes: string[],
    getItemType: (parts: string[]) => string
): IModularWeaponSaleInfo => {
    const rng = new CRng(day);
    const parts = partTypes.map(partType => rng.randomElement(partTypeToParts[partType]));
    let partsCost = 0;
    for (const part of parts) {
        const meta = ExportWeapons[part];
        if (!meta.premiumPrice) {
            throw new Error(`no premium price for ${part}`);
        }
        partsCost += meta.premiumPrice;
    }
    return {
        Name: name,
        Expiry: toMongoDate(new Date((day + 1) * 86400000)),
        Revision: day,
        Weapons: [
            {
                ItemType: getItemType(parts),
                PremiumPrice: Math.trunc(partsCost * priceFactor[name]),
                ModularParts: parts
            }
        ]
    };
};

interface IModularWeaponSaleInfo {
    Name: string;
    Expiry: IMongoDate;
    Revision: number;
    Weapons: IModularWeaponSaleItem[];
}

interface IModularWeaponSaleItem {
    ItemType: string;
    PremiumPrice: number;
    ModularParts: string[];
}
