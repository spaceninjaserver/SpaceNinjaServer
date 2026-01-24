import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { lockCheats } from "../../services/cheatsService.ts";
import type { IAccountCheats } from "../../types/inventoryTypes/inventoryTypes.ts";
import { sendWsBroadcastToGame } from "../../services/wsService.ts";

export const retroactivelyApplyCheatController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const meta = lockCheats[req.query.cheat as string as keyof IAccountCheats]!;
    const inventory = await getInventory(accountId, meta.projection);
    meta.cleanupInventory(inventory);

    if (!meta.isInventoryInIdealState(inventory)) {
        throw new Error(
            `cleanupInventory for ${req.query.cheat as string} does not satsify its isInventoryInIdealState`
        );
    }

    await inventory.save();
    res.end();
    sendWsBroadcastToGame(accountId, { sync_inventory: true }); // Not using broadcastInventoryUpdate because other webui tabs don't need to know.
};
