import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import { sendWsBroadcastToGame } from "../../services/wsService.ts";

export const unlockAllIntrinsicsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "PlayerSkills");
    inventory.PlayerSkills.LPS_PILOTING = 10;
    inventory.PlayerSkills.LPS_GUNNERY = 10;
    inventory.PlayerSkills.LPS_TACTICAL = 10;
    inventory.PlayerSkills.LPS_ENGINEERING = 10;
    inventory.PlayerSkills.LPS_COMMAND = 10;
    inventory.PlayerSkills.LPS_DRIFT_COMBAT = 10;
    inventory.PlayerSkills.LPS_DRIFT_RIDING = 10;
    inventory.PlayerSkills.LPS_DRIFT_OPPORTUNITY = 10;
    inventory.PlayerSkills.LPS_DRIFT_ENDURANCE = 10;
    await inventory.save();
    res.end();
    sendWsBroadcastToGame(accountId, { sync_inventory: true });
};
