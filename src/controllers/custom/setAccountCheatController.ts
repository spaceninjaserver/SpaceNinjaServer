import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, hasPermission } from "../../services/loginService.ts";
import { sendWsBroadcastEx, sendWsBroadcastTo, sendWsBroadcastToWebui } from "../../services/wsService.ts";
import {
    accountCheatBooleans,
    accountCheatNumbers,
    type IAccountCheats,
    type TAccountCheatBooleanKey,
    type TAccountCheatNumberKey
} from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";
import { logger } from "../../utils/logger.ts";
import { lockCheats } from "../../services/cheatsService.ts";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";

export const setAccountCheatController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);

    const payload = req.body as ISetAccountCheatRequest;
    if (accountCheatBooleans.indexOf(payload.key as TAccountCheatBooleanKey) != -1) {
        if (!hasPermission(account, `toggleCheat.${payload.key}`)) {
            throw new Error(`Permission denied`);
        }
    } else if (accountCheatNumbers.indexOf(payload.key as TAccountCheatNumberKey) == -1) {
        throw new Error(`unexpected setAccountCheat key: ${payload.key}`);
    }
    if (payload.value == undefined) {
        logger.warn(`Aborting setting ${payload.key} as undefined!`);
        return;
    }

    const meta = payload.value ? lockCheats[payload.key] : undefined;

    if (meta) {
        const inventory = await getInventory(account._id, `${payload.key} ${meta.projection}`);
        inventory[payload.key] = payload.value as never;
        if (!meta.isInventoryInIdealState(inventory)) {
            res.send("retroactivable");
        }
        await inventory.save();
    } else {
        await Inventory.updateOne(
            {
                accountOwnerId: account._id
            },
            {
                [payload.key]: payload.value
            }
        );
    }

    res.end();

    if (["infiniteCredits", "infinitePlatinum", "infiniteEndo", "infiniteRegalAya"].indexOf(payload.key) != -1) {
        // Game and all webui tabs need to refresh the inventory
        sendWsBroadcastTo(account._id.toString(), { update_inventory: true, sync_inventory: true });
    } else if (["infiniteTrades", "infiniteGifts", "skipAllDialogue", "skipAllPopups"].indexOf(payload.key) != -1) {
        // Only game and other webui tabs need to refresh the inventory
        sendWsBroadcastEx(
            { update_inventory: true, sync_inventory: true },
            account._id.toString(),
            parseInt(String(req.query.wsid))
        );
    } else {
        // Only other webui tabs need to refresh the inventory
        sendWsBroadcastToWebui({ update_inventory: true }, account._id.toString(), parseInt(String(req.query.wsid)));
    }
};

interface ISetAccountCheatRequest {
    key: keyof IAccountCheats;
    value: IAccountCheats[keyof IAccountCheats];
}
