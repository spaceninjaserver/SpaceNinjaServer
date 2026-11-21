import type { RequestHandler } from "express";
import { getInventory2, unlockFocusWay } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

const focusSchools = [
    "/Lotus/Upgrades/Focus/Attack/AttackFocusAbility",
    "/Lotus/Upgrades/Focus/Tactic/TacticFocusAbility",
    "/Lotus/Upgrades/Focus/Ward/WardFocusAbility",
    "/Lotus/Upgrades/Focus/Defense/DefenseFocusAbility",
    "/Lotus/Upgrades/Focus/Power/PowerFocusAbility"
];

export const unlockAllFocusSchoolsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory2(accountId, "FocusAbility", "FocusUpgrades");
    const missing = focusSchools.filter(type => !inventory.FocusUpgrades.some(upgrade => upgrade.ItemType == type));
    if (missing.length != 0) {
        for (const focusType of missing) {
            unlockFocusWay(inventory, focusType);
        }
        await inventory.save();
        broadcastInventoryUpdate(req);
    }
    res.json({ count: missing.length });
};
