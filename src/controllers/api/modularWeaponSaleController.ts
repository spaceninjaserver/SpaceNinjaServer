import { RequestHandler } from "express";
import { ExportWeapons } from "warframe-public-export-plus";
import { IMongoDate } from "@/src/types/commonTypes";
import { toMongoDate } from "@/src/helpers/inventoryHelpers";
import { CRng } from "@/src/services/rngService";
import { ArtifactPolarity, EquipmentFeatures } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import {
    addEquipment,
    applyDefaultUpgrades,
    getInventory,
    occupySlot,
    productCategoryToInventoryBin,
    updateCurrency
} from "@/src/services/inventoryService";
import { getDefaultUpgrades } from "@/src/services/itemDataService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { modularWeaponTypes } from "@/src/helpers/modularWeaponHelper";
import { IInventoryChanges } from "@/src/types/purchaseTypes";

export const modularWeaponSaleController: RequestHandler = async (req, res) => {
    const partTypeToParts: Record<string, string[]> = {};
    for (const [uniqueName, data] of Object.entries(ExportWeapons)) {
        if (data.partType && data.premiumPrice) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            partTypeToParts[data.partType] ??= [];
            partTypeToParts[data.partType].push(uniqueName);
        }
    }

    if (req.query.op == "SyncAll") {
        res.json({
            SaleInfos: getSaleInfos(partTypeToParts, Math.trunc(Date.now() / 86400000))
        });
    } else if (req.query.op == "Purchase") {
        const accountId = await getAccountIdForRequest(req);
        const inventory = await getInventory(accountId);
        const payload = getJSONfromString<IModularWeaponPurchaseRequest>(String(req.body));
        const weaponInfo = getSaleInfos(partTypeToParts, payload.Revision).find(x => x.Name == payload.SaleName)!
            .Weapons[payload.ItemIndex];
        const category = modularWeaponTypes[weaponInfo.ItemType];
        const defaultUpgrades = getDefaultUpgrades(weaponInfo.ModularParts);
        const configs = applyDefaultUpgrades(inventory, defaultUpgrades);
        const inventoryChanges: IInventoryChanges = {
            ...addEquipment(
                inventory,
                category,
                weaponInfo.ItemType,
                weaponInfo.ModularParts,
                {},
                {
                    Features: EquipmentFeatures.DOUBLE_CAPACITY | EquipmentFeatures.GILDED,
                    ItemName: payload.ItemName,
                    Configs: configs,
                    Polarity: [
                        {
                            Slot: payload.PolarizeSlot,
                            Value: payload.PolarizeValue
                        }
                    ]
                }
            ),
            ...occupySlot(inventory, productCategoryToInventoryBin(category)!, true),
            ...updateCurrency(inventory, weaponInfo.PremiumPrice, true)
        };
        if (defaultUpgrades) {
            inventoryChanges.RawUpgrades = defaultUpgrades.map(x => ({ ItemType: x.ItemType, ItemCount: 1 }));
        }
        await inventory.save();
        res.json({
            InventoryChanges: inventoryChanges
        });
    } else {
        throw new Error(`unknown modularWeaponSale op: ${String(req.query.op)}`);
    }
};

const getSaleInfos = (partTypeToParts: Record<string, string[]>, day: number): IModularWeaponSaleInfo[] => {
    const kitgunIsPrimary: boolean = (day & 1) != 0;
    return [
        getModularWeaponSale(
            partTypeToParts,
            day,
            "Ostron",
            ["LWPT_HILT", "LWPT_BLADE", "LWPT_HILT_WEIGHT"],
            () => "/Lotus/Weapons/Ostron/Melee/LotusModularWeapon"
        ),
        getModularWeaponSale(
            partTypeToParts,
            day,
            "SolarisUnitedHoverboard",
            ["LWPT_HB_DECK", "LWPT_HB_ENGINE", "LWPT_HB_FRONT", "LWPT_HB_JET"],
            () => "/Lotus/Types/Vehicles/Hoverboard/HoverboardSuit"
        ),
        getModularWeaponSale(
            partTypeToParts,
            day,
            "SolarisUnitedMoaPet",
            ["LWPT_MOA_LEG", "LWPT_MOA_HEAD", "LWPT_MOA_ENGINE", "LWPT_MOA_PAYLOAD"],
            () => "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetPowerSuit"
        ),
        getModularWeaponSale(
            partTypeToParts,
            day,
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
    ];
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
        partsCost += ExportWeapons[part].premiumPrice!;
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

interface IModularWeaponPurchaseRequest {
    SaleName: string;
    ItemIndex: number;
    Revision: number;
    ItemName: string;
    PolarizeSlot: number;
    PolarizeValue: ArtifactPolarity;
}
