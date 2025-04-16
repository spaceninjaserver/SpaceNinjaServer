import { addCrewShipSalvagedWeaponSkin, addCrewShipRawSalvage, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";
import { IInnateDamageFingerprint } from "@/src/types/inventoryTypes/inventoryTypes";
import { ExportCustoms } from "warframe-public-export-plus";
import { IFingerprintStat } from "@/src/helpers/rivenHelper";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { IInventoryChanges } from "@/src/types/purchaseTypes";

export const crewShipIdentifySalvageController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "CrewShipSalvagedWeaponSkins CrewShipRawSalvage");
    const payload = getJSONfromString<ICrewShipIdentifySalvageRequest>(String(req.body));

    const buffs: IFingerprintStat[] = [];
    for (const upgrade of ExportCustoms[payload.ItemType].randomisedUpgrades!) {
        buffs.push({ Tag: upgrade.tag, Value: Math.trunc(Math.random() * 0x40000000) });
    }
    const inventoryChanges: IInventoryChanges = addCrewShipSalvagedWeaponSkin(
        inventory,
        payload.ItemType,
        JSON.stringify({ compat: payload.ItemType, buffs } satisfies IInnateDamageFingerprint)
    );

    inventoryChanges.CrewShipRawSalvage = [
        {
            ItemType: payload.ItemType,
            ItemCount: -1
        }
    ];
    addCrewShipRawSalvage(inventory, inventoryChanges.CrewShipRawSalvage);

    await inventory.save();
    res.json({
        InventoryChanges: inventoryChanges
    });
};

interface ICrewShipIdentifySalvageRequest {
    ItemType: string;
}
