import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import type { IOid } from "@/src/types/commonTypes";
import type { IInnateDamageFingerprint, TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";
import type { RequestHandler } from "express";

export const valenceSwapController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const body = JSON.parse(String(req.body)) as IValenceSwapRequest;
    const inventory = await getInventory(accountId, body.WeaponCategory);
    const weapon = inventory[body.WeaponCategory].id(body.WeaponId.$oid)!;

    const upgradeFingerprint = JSON.parse(weapon.UpgradeFingerprint!) as IInnateDamageFingerprint;
    upgradeFingerprint.buffs[0].Tag = body.NewValenceUpgradeTag;
    weapon.UpgradeFingerprint = JSON.stringify(upgradeFingerprint);

    await inventory.save();
    res.json({
        InventoryChanges: {
            [body.WeaponCategory]: [weapon.toJSON()]
        }
    });
};

interface IValenceSwapRequest {
    WeaponId: IOid;
    WeaponCategory: TEquipmentKey;
    NewValenceUpgradeTag: string;
}
