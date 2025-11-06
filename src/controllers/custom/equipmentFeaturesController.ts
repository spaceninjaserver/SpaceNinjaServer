import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { TEquipmentKey } from "../../types/inventoryTypes/inventoryTypes.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { EquipmentFeatures } from "../../types/equipmentTypes.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";

export const equipmentFeaturesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const category = req.query.Category as TEquipmentKey;
    const inventory = await getInventory(
        accountId,
        `${category} unlockDoubleCapacityPotatoesEverywhere unlockExilusEverywhere unlockArcanesEverywhere`
    );
    const bit = Number(req.query.bit) as EquipmentFeatures;
    if (
        (inventory.unlockDoubleCapacityPotatoesEverywhere && bit === EquipmentFeatures.DOUBLE_CAPACITY) ||
        (inventory.unlockExilusEverywhere && bit === EquipmentFeatures.UTILITY_SLOT) ||
        (inventory.unlockArcanesEverywhere &&
            (bit === EquipmentFeatures.ARCANE_SLOT || bit === EquipmentFeatures.SECOND_ARCANE_SLOT))
    ) {
        res.status(400).end();
    }
    const item = inventory[category].id(req.query.ItemId as string);
    if (item) {
        item.Features ??= 0;
        item.Features ^= bit;
        await inventory.save();
        sendWsBroadcastTo(accountId, { sync_inventory: true });
        res.status(200).end();
    } else {
        res.status(400).end();
    }
};
