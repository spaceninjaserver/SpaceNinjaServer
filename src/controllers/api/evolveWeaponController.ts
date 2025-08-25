import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { addMiscItems, getInventory } from "../../services/inventoryService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import type { WeaponTypeInternal } from "../../services/itemDataService.ts";
import { getRecipe } from "../../services/itemDataService.ts";
import { EquipmentFeatures } from "../../types/equipmentTypes.ts";

export const evolveWeaponController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const payload = getJSONfromString<IEvolveWeaponRequest>(String(req.body));

    const recipe = getRecipe(payload.Recipe)!;
    if (payload.Action == "EWA_INSTALL") {
        addMiscItems(
            inventory,
            recipe.ingredients.map(x => ({ ItemType: x.ItemType, ItemCount: x.ItemCount * -1 }))
        );

        const item = inventory[payload.Category].id(req.query.ItemId as string)!;
        item.Features ??= 0;
        item.Features |= EquipmentFeatures.INCARNON_GENESIS;

        item.SkillTree = "0";

        inventory.EvolutionProgress ??= [];
        if (!inventory.EvolutionProgress.find(entry => entry.ItemType == payload.EvoType)) {
            inventory.EvolutionProgress.push({
                Progress: 0,
                Rank: 1,
                ItemType: payload.EvoType
            });
        }
    } else if (payload.Action == "EWA_UNINSTALL") {
        addMiscItems(inventory, [
            {
                ItemType: recipe.resultType,
                ItemCount: 1
            }
        ]);

        const item = inventory[payload.Category].id(req.query.ItemId as string)!;
        item.Features! &= ~EquipmentFeatures.INCARNON_GENESIS;
    } else {
        throw new Error(`unexpected evolve weapon action: ${payload.Action}`);
    }

    await inventory.save();
    res.end();
};

interface IEvolveWeaponRequest {
    Action: string;
    Category: WeaponTypeInternal;
    Recipe: string; // e.g. "/Lotus/Types/Items/MiscItems/IncarnonAdapters/UnlockerBlueprints/DespairIncarnonBlueprint"
    UninstallRecipe: "";
    EvoType: string; // e.g. "/Lotus/Weapons/Tenno/ThrowingWeapons/StalkerKunai"
}
