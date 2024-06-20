import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { WeaponTypeInternal } from "@/src/services/itemDataService";
import { EquipmentFeatures } from "@/src/types/inventoryTypes/commonInventoryTypes";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const evolveWeaponController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const payload = getJSONfromString(req.body.toString()) as IEvolveWeaponRequest;
    console.assert(payload.Action == "EWA_INSTALL");

    // TODO: We should remove the Genesis item & its resources, but currently we don't know these "recipes".

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

    await inventory.save();
    res.end();
};

interface IEvolveWeaponRequest {
    Action: "EWA_INSTALL";
    Category: WeaponTypeInternal;
    Recipe: string; // e.g. "/Lotus/Types/Items/MiscItems/IncarnonAdapters/UnlockerBlueprints/DespairIncarnonBlueprint"
    UninstallRecipe: "";
    EvoType: string; // e.g. "/Lotus/Weapons/Tenno/ThrowingWeapons/StalkerKunai"
}
