import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addMiscItems, getInventory } from "@/src/services/inventoryService";
import { WeaponTypeInternal } from "@/src/services/itemDataService";
import { ArtifactPolarity, EquipmentFeatures, IEquipmentClient } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { ExportRecipes } from "warframe-public-export-plus";
import { IInventoryChanges } from "@/src/types/purchaseTypes";

const modularWeaponCategory: (WeaponTypeInternal | "Hoverboards")[] = [
    "LongGuns",
    "Pistols",
    "Melee",
    "OperatorAmps",
    "Hoverboards"
];

interface IGildWeaponRequest {
    ItemName: string;
    Recipe: string; // e.g. /Lotus/Weapons/SolarisUnited/LotusGildKitgunBlueprint
    PolarizeSlot?: number;
    PolarizeValue?: ArtifactPolarity;
    ItemId: string;
    Category: WeaponTypeInternal | "Hoverboards";
}

export const gildWeaponController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString<IGildWeaponRequest>(String(req.body));
    data.ItemId = String(req.query.ItemId);
    if (!modularWeaponCategory.includes(req.query.Category as WeaponTypeInternal | "Hoverboards")) {
        throw new Error(`Unknown modular weapon Category: ${String(req.query.Category)}`);
    }
    data.Category = req.query.Category as WeaponTypeInternal | "Hoverboards";

    const inventory = await getInventory(accountId);
    const weaponIndex = inventory[data.Category].findIndex(x => String(x._id) === data.ItemId);
    if (weaponIndex === -1) {
        throw new Error(`Weapon with ${data.ItemId} not found in category ${String(req.query.Category)}`);
    }

    const weapon = inventory[data.Category][weaponIndex];
    weapon.Features ??= 0;
    weapon.Features |= EquipmentFeatures.GILDED;
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
    const inventoryChanges: IInventoryChanges = {};
    inventoryChanges[data.Category] = [weapon.toJSON<IEquipmentClient>()];

    const recipe = ExportRecipes[data.Recipe];
    inventoryChanges.MiscItems = recipe.secretIngredients!.map(ingredient => ({
        ItemType: ingredient.ItemType,
        ItemCount: ingredient.ItemCount * -1
    }));
    addMiscItems(inventory, inventoryChanges.MiscItems);

    const affiliationMods = [];
    if (recipe.syndicateStandingChange) {
        const affiliation = inventory.Affiliations.find(x => x.Tag == recipe.syndicateStandingChange!.tag)!;
        affiliation.Standing += recipe.syndicateStandingChange.value;
        affiliationMods.push({
            Tag: recipe.syndicateStandingChange.tag,
            Standing: recipe.syndicateStandingChange.value
        });
    }

    await inventory.save();
    res.json({
        InventoryChanges: inventoryChanges,
        AffiliationMods: affiliationMods
    });
};
