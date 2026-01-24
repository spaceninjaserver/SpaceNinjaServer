import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { sendWsBroadcastEx, sendWsBroadcastTo } from "../../services/wsService.ts";
import type { IAccountCheats } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";
import { logger } from "../../utils/logger.ts";
import { lockCheats } from "../../services/cheatsService.ts";

export const setAccountCheatController: RequestHandler = async (req, res) => {
    const payload = req.body as ISetAccountCheatRequest;
    if (payload.value == undefined) {
        logger.warn(`Aborting setting ${payload.key} as undefined!`);
        return;
    }

    const accountId = await getAccountIdForRequest(req);
    const meta = payload.value ? lockCheats[payload.key] : undefined;
    const inventory = await getInventory(accountId, meta ? `${payload.key} ${meta.projection}` : payload.key);

    inventory[payload.key] = payload.value as never;
    if (meta && !meta.isInventoryInIdealState(inventory)) {
        res.send("retroactivable");
    }
    await inventory.save();
    res.end();
    if (["infiniteCredits", "infinitePlatinum", "infiniteEndo", "infiniteRegalAya"].indexOf(payload.key) != -1) {
        sendWsBroadcastTo(accountId, { update_inventory: true, sync_inventory: true });
    } else {
        sendWsBroadcastEx({ update_inventory: true }, accountId, parseInt(String(req.query.wsid)));
    }
};

interface ISetAccountCheatRequest {
    key: keyof IAccountCheats;
    value: IAccountCheats[keyof IAccountCheats];
}
