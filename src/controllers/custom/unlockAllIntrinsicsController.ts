import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import { sendWsBroadcastToGame } from "../../services/wsService.ts";

export const unlockAllIntrinsicsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const intrinsics = [
        "LPS_PILOTING",
        "LPS_GUNNERY",
        "LPS_TACTICAL",
        "LPS_ENGINEERING",
        "LPS_COMMAND",
        "LPS_DRIFT_COMBAT",
        "LPS_DRIFT_RIDING",
        "LPS_DRIFT_OPPORTUNITY",
        "LPS_DRIFT_ENDURANCE"
    ];
    const { modifiedCount } = await Inventory.updateOne(
        { accountOwnerId: accountId },
        { $set: Object.fromEntries(intrinsics.map(skill => ["PlayerSkills." + skill, 10])) }
    );
    if (modifiedCount != 0) {
        sendWsBroadcastToGame(accountId, { sync_inventory: true });
    }
    res.json({ count: modifiedCount });
};
