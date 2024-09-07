import { RequestHandler } from "express";
import { IUpgradesRequest } from "@/src/types/requestTypes";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const upgradesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = JSON.parse(String(req.body)) as IUpgradesRequest;
    const inventory = await getInventory(accountId);
    console.log(req.body);
    for (const item of payload.UpgradesToAttach) {
        for (const upgrade of inventory.Upgrades) {
            if (upgrade._id?.toString() == item.ItemId.$id) {
                upgrade.UpgradeFingerprint = item.UpgradeFingerprint;
                upgrade.Slot = item.Slot;
                upgrade.ParentId = payload.Weapon.ItemId;
            }
        }
    }

    for (const item of payload.UpgradesToDetach) {
        for (const upgrade of inventory.Upgrades) {
            if (upgrade._id?.toString() == item.ItemId.$id) {
                upgrade.UpgradeFingerprint = undefined;
                upgrade.Slot = undefined;
                upgrade.ParentId = undefined;
            }
        }
    }

    await inventory.save();
    res.json({});
};
