import type { RequestHandler } from "express";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { sendWsBroadcastToGame } from "../../services/wsService.ts";

export const unlockAllSimarisResearchEntriesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const researchTargets = [
        "/Lotus/Types/Game/Library/Targets/Research1Target",
        "/Lotus/Types/Game/Library/Targets/Research2Target",
        "/Lotus/Types/Game/Library/Targets/Research3Target",
        "/Lotus/Types/Game/Library/Targets/Research4Target",
        "/Lotus/Types/Game/Library/Targets/Research5Target",
        "/Lotus/Types/Game/Library/Targets/Research6Target",
        "/Lotus/Types/Game/Library/Targets/Research7Target"
    ];
    const { modifiedCount } = await Inventory.updateOne(
        { accountOwnerId: accountId },
        {
            $set: {
                LibraryPersonalProgress: researchTargets.map(type => ({ TargetType: type, Scans: 10, Completed: true }))
            },
            $unset: { LibraryPersonalTarget: 1 }
        }
    );
    if (modifiedCount != 0) {
        sendWsBroadcastToGame(accountId, { sync_inventory: true });
    }
    res.json({ count: modifiedCount });
};
