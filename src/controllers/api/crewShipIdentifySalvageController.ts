import {
    addCrewShipSalvagedWeaponSkin,
    addCrewShipRawSalvage,
    getInventory,
    addEquipment
} from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import type { RequestHandler } from "express";
import type {
    ICrewShipComponentFingerprint,
    IInnateDamageFingerprint
} from "@/src/types/inventoryTypes/inventoryTypes";
import { ExportCustoms, ExportRailjackWeapons, ExportUpgrades } from "warframe-public-export-plus";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import type { IInventoryChanges } from "@/src/types/purchaseTypes";
import { getRandomInt } from "@/src/services/rngService";
import type { IFingerprintStat } from "@/src/helpers/rivenHelper";
import type { IEquipmentDatabase } from "@/src/types/equipmentTypes";

export const crewShipIdentifySalvageController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(
        accountId,
        "CrewShipSalvagedWeaponSkins CrewShipSalvagedWeapons CrewShipRawSalvage"
    );
    const payload = getJSONfromString<ICrewShipIdentifySalvageRequest>(String(req.body));

    const inventoryChanges: IInventoryChanges = {};
    if (payload.ItemType in ExportCustoms) {
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
        addCrewShipSalvagedWeaponSkin(
            inventory,
            payload.ItemType,
            JSON.stringify(upgradeFingerprint),
            inventoryChanges
        );
    } else {
        const meta = ExportRailjackWeapons[payload.ItemType];
        let defaultOverwrites: Partial<IEquipmentDatabase> | undefined;
        if (meta.defaultUpgrades?.[0]) {
            const upgradeType = meta.defaultUpgrades[0].ItemType;
            const upgradeMeta = ExportUpgrades[upgradeType];
            const buffs: IFingerprintStat[] = [];
            for (const buff of upgradeMeta.upgradeEntries!) {
                buffs.push({
                    Tag: buff.tag,
                    Value: Math.trunc(Math.random() * 0x40000000)
                });
            }
            defaultOverwrites = {
                UpgradeType: upgradeType,
                UpgradeFingerprint: JSON.stringify({
                    compat: payload.ItemType,
                    buffs
                } satisfies IInnateDamageFingerprint)
            };
        }
        addEquipment(inventory, "CrewShipSalvagedWeapons", payload.ItemType, defaultOverwrites, inventoryChanges);
    }

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
