import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addMiscItems, freeUpSlot, getInventory, updateCurrency } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IOid } from "@/src/types/commonTypes";
import { ICrewShipComponentFingerprint, InventorySlot } from "@/src/types/inventoryTypes/inventoryTypes";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { RequestHandler } from "express";
import { ExportCustoms, ExportDojoRecipes } from "warframe-public-export-plus";

export const crewShipFusionController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const payload = getJSONfromString<ICrewShipFusionRequest>(String(req.body));

    const isWeapon = inventory.CrewShipWeapons.id(payload.PartA.$oid);
    const itemA = isWeapon ?? inventory.CrewShipWeaponSkins.id(payload.PartA.$oid)!;
    const category = isWeapon ? "CrewShipWeapons" : "CrewShipWeaponSkins";
    const salvageCategory = isWeapon ? "CrewShipSalvagedWeapons" : "CrewShipSalvagedWeaponSkins";
    const itemB = inventory[payload.SourceRecipe ? salvageCategory : category].id(payload.PartB.$oid)!;
    const tierA = itemA.ItemType.charCodeAt(itemA.ItemType.length - 1) - 65;
    const tierB = itemB.ItemType.charCodeAt(itemB.ItemType.length - 1) - 65;

    const inventoryChanges: IInventoryChanges = {};

    // Charge partial repair cost if fusing with an identified but unrepaired part
    if (payload.SourceRecipe) {
        const recipe = ExportDojoRecipes.research[payload.SourceRecipe];
        updateCurrency(inventory, Math.round(recipe.price * 0.4), false, inventoryChanges);
        const miscItemChanges = recipe.ingredients.map(x => ({ ...x, ItemCount: Math.round(x.ItemCount * -0.4) }));
        addMiscItems(inventory, miscItemChanges);
        inventoryChanges.MiscItems = miscItemChanges;
    }

    // Remove inferior item
    if (payload.SourceRecipe) {
        inventory[salvageCategory].pull({ _id: payload.PartB.$oid });
        inventoryChanges.RemovedIdItems = [{ ItemId: payload.PartB }];
    } else {
        const inferiorId = tierA < tierB ? payload.PartA : payload.PartB;
        inventory[category].pull({ _id: inferiorId.$oid });
        inventoryChanges.RemovedIdItems = [{ ItemId: inferiorId }];
        freeUpSlot(inventory, InventorySlot.RJ_COMPONENT_AND_ARMAMENTS);
        inventoryChanges[InventorySlot.RJ_COMPONENT_AND_ARMAMENTS] = { count: -1, platinum: 0, Slots: 1 };
    }

    // Upgrade superior item
    const superiorItem = tierA < tierB ? itemB : itemA;
    const inferiorItem = tierA < tierB ? itemA : itemB;
    const fingerprint: ICrewShipComponentFingerprint = JSON.parse(
        superiorItem.UpgradeFingerprint!
    ) as ICrewShipComponentFingerprint;
    const inferiorFingerprint: ICrewShipComponentFingerprint = inferiorItem.UpgradeFingerprint
        ? (JSON.parse(inferiorItem.UpgradeFingerprint) as ICrewShipComponentFingerprint)
        : { compat: "", buffs: [] };
    if (isWeapon) {
        for (let i = 0; i != fingerprint.buffs.length; ++i) {
            const buffA = fingerprint.buffs[i];
            const buffB = i < inferiorFingerprint.buffs.length ? inferiorFingerprint.buffs[i] : undefined;
            const fvalA = buffA.Value / 0x3fffffff;
            const fvalB = (buffB?.Value ?? 0) / 0x3fffffff;
            const percA = 0.3 + fvalA * (0.6 - 0.3);
            const percB = 0.3 + fvalB * (0.6 - 0.3);
            const newPerc = Math.min(0.6, Math.max(percA, percB) * FUSE_MULTIPLIERS[Math.abs(tierA - tierB)]);
            const newFval = (newPerc - 0.3) / (0.6 - 0.3);
            buffA.Value = Math.trunc(newFval * 0x3fffffff);
        }
    } else {
        const superiorMeta = ExportCustoms[superiorItem.ItemType].randomisedUpgrades ?? [];
        const inferiorMeta = ExportCustoms[inferiorItem.ItemType].randomisedUpgrades ?? [];
        for (let i = 0; i != inferiorFingerprint.buffs.length; ++i) {
            const buffA = fingerprint.buffs[i];
            const buffB = inferiorFingerprint.buffs[i];
            const fvalA = buffA.Value / 0x3fffffff;
            const fvalB = buffB.Value / 0x3fffffff;
            const rangeA = superiorMeta[i].range;
            const rangeB = inferiorMeta[i].range;
            const percA = rangeA[0] + fvalA * (rangeA[1] - rangeA[0]);
            const percB = rangeB[0] + fvalB * (rangeB[1] - rangeB[0]);
            const newPerc = Math.min(rangeA[1], Math.max(percA, percB) * FUSE_MULTIPLIERS[Math.abs(tierA - tierB)]);
            const newFval = (newPerc - rangeA[0]) / (rangeA[1] - rangeA[0]);
            buffA.Value = Math.trunc(newFval * 0x3fffffff);
        }
        if (inferiorFingerprint.SubroutineIndex) {
            const useSuperiorSubroutine = tierA < tierB ? !payload.UseSubroutineA : payload.UseSubroutineA;
            if (!useSuperiorSubroutine) {
                fingerprint.SubroutineIndex = inferiorFingerprint.SubroutineIndex;
            }
        }
    }
    superiorItem.UpgradeFingerprint = JSON.stringify(fingerprint);
    inventoryChanges[category] = [superiorItem.toJSON() as any];

    await inventory.save();
    res.json({
        InventoryChanges: inventoryChanges
    });
};

interface ICrewShipFusionRequest {
    PartA: IOid;
    PartB: IOid;
    SourceRecipe: string;
    UseSubroutineA: boolean;
}

const FUSE_MULTIPLIERS = [1.1, 1.05, 1.02];
