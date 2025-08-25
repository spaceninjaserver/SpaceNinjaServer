import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { addMiscItems, getInventory } from "../../services/inventoryService.ts";
import type { TEquipmentKey } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { ArtifactPolarity } from "../../types/inventoryTypes/commonInventoryTypes.ts";
import { ExportRecipes } from "warframe-public-export-plus";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import type { IEquipmentClient } from "../../types/equipmentTypes.ts";
import { EquipmentFeatures } from "../../types/equipmentTypes.ts";

interface IGildWeaponRequest {
    ItemName: string;
    Recipe: string; // e.g. /Lotus/Weapons/SolarisUnited/LotusGildKitgunBlueprint
    PolarizeSlot?: number;
    PolarizeValue?: ArtifactPolarity;
    ItemId: string;
    Category: TEquipmentKey;
}

export const gildWeaponController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString<IGildWeaponRequest>(String(req.body));
    data.ItemId = String(req.query.ItemId);
    data.Category = req.query.Category as TEquipmentKey;

    const inventory = await getInventory(accountId);
    const weaponIndex = inventory[data.Category].findIndex(x => String(x._id) === data.ItemId);
    if (weaponIndex === -1) {
        throw new Error(`Weapon with ${data.ItemId} not found in category ${String(req.query.Category)}`);
    }

    const weapon = inventory[data.Category][weaponIndex];
    weapon.Features ??= 0;
    weapon.Features |= EquipmentFeatures.GILDED;
    if (data.Recipe != "webui") {
        weapon.ItemName = data.ItemName;
        weapon.XP = 0;
    }
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

    const affiliationMods = [];

    if (data.Recipe != "webui") {
        const recipe = ExportRecipes[data.Recipe];
        inventoryChanges.MiscItems = recipe.secretIngredients!.map(ingredient => ({
            ItemType: ingredient.ItemType,
            ItemCount: ingredient.ItemCount * -1
        }));
        addMiscItems(inventory, inventoryChanges.MiscItems);

        if (recipe.syndicateStandingChange) {
            const affiliation = inventory.Affiliations.find(x => x.Tag == recipe.syndicateStandingChange!.tag)!;
            affiliation.Standing += recipe.syndicateStandingChange.value;
            affiliationMods.push({
                Tag: recipe.syndicateStandingChange.tag,
                Standing: recipe.syndicateStandingChange.value
            });
        }
    }

    await inventory.save();
    res.json({
        InventoryChanges: inventoryChanges,
        AffiliationMods: affiliationMods
    });
    sendWsBroadcastTo(accountId, { update_inventory: true });
};
