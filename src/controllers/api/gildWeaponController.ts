import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { WeaponTypeInternal } from "@/src/services/itemDataService";
import { ArtifactPolarity, EquipmentFeatures } from "@/src/types/inventoryTypes/commonInventoryTypes";

const modularWeaponCategory: (WeaponTypeInternal | "Hoverboards")[] = [
    "LongGuns",
    "Pistols",
    "Melee",
    "OperatorAmps",
    "Hoverboards" // Not sure about hoverboards just coppied from modual crafting
];

interface IGildWeaponRequest {
    ItemName: string;
    Recipe: string; // /Lotus/Weapons/SolarisUnited/LotusGildKitgunBlueprint
    PolarizeSlot?: number;
    PolarizeValue?: ArtifactPolarity;
    ItemId: string;
    Category: WeaponTypeInternal | "Hoverboards";
}

// In export there no recipes for gild action, so reputation and ressources only consumed visually

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const gildWeaponController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data: IGildWeaponRequest = getJSONfromString(String(req.body));
    data.ItemId = String(req.query.ItemId);
    if (!modularWeaponCategory.includes(req.query.Category as WeaponTypeInternal | "Hoverboards")) {
        throw new Error(`Unknown modular weapon Category: ${req.query.Category}`);
    }
    data.Category = req.query.Category as WeaponTypeInternal | "Hoverboards";

    const inventory = await getInventory(accountId);
    if (!inventory[data.Category]) {
        throw new Error(`Category ${req.query.Category} not found in inventory`);
    }
    const weaponIndex = inventory[data.Category].findIndex(x => String(x._id) === data.ItemId);
    if (weaponIndex === -1) {
        throw new Error(`Weapon with ${data.ItemId} not found in category ${req.query.Category}`);
    }

    const weapon = inventory[data.Category][weaponIndex];
    weapon.Features = EquipmentFeatures.GILDED; // maybe 9 idk if DOUBLE_CAPACITY is also given
    weapon.ItemName = data.ItemName;
    weapon.XP = 0;
    if (data.Category != "OperatorAmps" && data.PolarizeSlot && data.PolarizeValue) {
        weapon.Polarity = [
            {
                Slot: data.PolarizeSlot,
                Value: data.PolarizeValue
            }
        ];
    }
    inventory[data.Category][weaponIndex] = weapon;
    await inventory.save();

    res.json({
        InventoryChanges: {
            [data.Category]: [weapon]
        }
    });
};
