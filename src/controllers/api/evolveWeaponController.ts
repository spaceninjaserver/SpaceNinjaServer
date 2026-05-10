import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { addMiscItems, getInventory2 } from "../../services/inventoryService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import type { WeaponTypeInternal } from "../../services/itemDataService.ts";
import { getRecipe } from "../../services/itemDataService.ts";
import { eEquipmentFeatures } from "../../types/equipmentTypes.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const evolveWeaponController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString<IEvolveWeaponRequest>(String(req.body));
    const inventory = await getInventory2(accountId, payload.Category, "MiscItems", "EvolutionProgress");

    const recipe = getRecipe(payload.Recipe)!;
    if (payload.Action == "EWA_INSTALL") {
        addMiscItems(
            inventory,
            recipe.ingredients.map(x => ({ ItemType: x.ItemType, ItemCount: x.ItemCount * -1 }))
        );

        const item = inventory[payload.Category].id(req.query.ItemId as string)!;
        item.Features ??= 0;
        item.Features |= eEquipmentFeatures.INCARNON_GENESIS;

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
        item.Features! &= ~eEquipmentFeatures.INCARNON_GENESIS;
    } else {
        throw new Error(`unexpected evolve weapon action: ${payload.Action}`);
    }

    await inventory.save();
    res.end();
    broadcastInventoryUpdate(req); // let webui know that the feature flag has changed (for detailed view)
};

interface IEvolveWeaponRequest {
    Action: string;
    Category: WeaponTypeInternal;
    Recipe: string; // e.g. "/Lotus/Types/Items/MiscItems/IncarnonAdapters/UnlockerBlueprints/DespairIncarnonBlueprint"
    UninstallRecipe: "";
    EvoType: string; // e.g. "/Lotus/Weapons/Tenno/ThrowingWeapons/StalkerKunai"
}
