import { addCrewShipSalvagedWeaponSkin, addCrewShipRawSalvage, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";
import { ICrewShipComponentFingerprint } from "@/src/types/inventoryTypes/inventoryTypes";
import { ExportCustoms } from "warframe-public-export-plus";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { getRandomInt } from "@/src/services/rngService";

export const crewShipIdentifySalvageController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "CrewShipSalvagedWeaponSkins CrewShipRawSalvage");
    const payload = getJSONfromString<ICrewShipIdentifySalvageRequest>(String(req.body));

    const meta = ExportCustoms[payload.ItemType];
    let upgradeFingerprint: ICrewShipComponentFingerprint = { compat: payload.ItemType, buffs: [] };
    if (meta.subroutines) {
        upgradeFingerprint = {
            SubroutineIndex: getRandomInt(0, meta.subroutines.length - 1),
            ...upgradeFingerprint
        };
    }
    for (const upgrade of meta.randomisedUpgrades!) {
        upgradeFingerprint.buffs.push({ Tag: upgrade.tag, Value: Math.trunc(Math.random() * 0x40000000) });
    }
    const inventoryChanges: IInventoryChanges = addCrewShipSalvagedWeaponSkin(
        inventory,
        payload.ItemType,
        JSON.stringify(upgradeFingerprint)
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
