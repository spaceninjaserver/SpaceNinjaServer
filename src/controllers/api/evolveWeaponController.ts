import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addMiscItems, getInventory } from "@/src/services/inventoryService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getRecipe, WeaponTypeInternal } from "@/src/services/itemDataService";
import { EquipmentFeatures } from "@/src/types/inventoryTypes/commonInventoryTypes";

export const evolveWeaponController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const payload = getJSONfromString(String(req.body)) as IEvolveWeaponRequest;

    const recipe = getRecipe(payload.Recipe)!;
    if (payload.Action == "EWA_INSTALL") {
        addMiscItems(
            inventory,
            recipe.ingredients.map(x => ({ ItemType: x.ItemType, ItemCount: x.ItemCount * -1 }))
        );

        const item = inventory[payload.Category].find(item => item._id.toString() == (req.query.ItemId as string))!;
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

        const item = inventory[payload.Category].find(item => item._id.toString() == (req.query.ItemId as string))!;
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
