import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { TEquipmentKey } from "../../types/inventoryTypes/inventoryTypes.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { eEquipmentFeatures, type TEquipmentFeatures } from "../../types/equipmentTypes.ts";
import { broadcastInventoryUpdate, sendWsBroadcastTo } from "../../services/wsService.ts";
import allIncarnons from "../../../static/fixed_responses/allIncarnonList.json" with { type: "json" };
import { ExportWeapons } from "warframe-public-export-plus";

export const equipmentFeaturesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const category = req.query.Category as TEquipmentKey;
    const inventory = await getInventory(
        accountId,
        `${category} EvolutionProgress unlockDoubleCapacityPotatoesEverywhere unlockExilusEverywhere unlockArcanesEverywhere`
    );
    const bit = Number(req.query.bit) as TEquipmentFeatures;
    /*if (
        (inventory.unlockDoubleCapacityPotatoesEverywhere && bit === EquipmentFeatures.DOUBLE_CAPACITY) ||
        (inventory.unlockExilusEverywhere && bit === EquipmentFeatures.UTILITY_SLOT) ||
        (inventory.unlockArcanesEverywhere &&
            (bit === EquipmentFeatures.ARCANE_SLOT || bit === EquipmentFeatures.SECOND_ARCANE_SLOT))
    ) {
        res.status(400).end();
        return;
    }*/
    const item = inventory[category].id(req.query.ItemId as string);
    if (item) {
        item.Features ??= 0;
        let requesterNeedsInventoryUpdateToo = false;
        if (bit == eEquipmentFeatures.INCARNON_GENESIS) {
            const parentName = ExportWeapons[item.ItemType].parentName;
            let searchType: string | undefined;

            if (allIncarnons.includes(item.ItemType)) {
                searchType = item.ItemType;
            } else if (allIncarnons.includes(parentName)) {
                searchType = parentName;
            }

            if (searchType) {
                item.SkillTree = "0";
                inventory.EvolutionProgress ??= [];
                if (!inventory.EvolutionProgress.find(entry => entry.ItemType == searchType)) {
                    inventory.EvolutionProgress.push({
                        Progress: 0,
                        Rank: 1,
                        ItemType: searchType
                    });
                    requesterNeedsInventoryUpdateToo = true;
                }
            } else {
                res.status(400).end();
            }
        }
        item.Features ^= bit;
        await inventory.save();
        res.status(200).end();
        if (requesterNeedsInventoryUpdateToo) {
            sendWsBroadcastTo(accountId, { sync_inventory: true, update_inventory: true });
        } else {
            broadcastInventoryUpdate(req);
        }
    } else {
        res.status(400).end();
    }
};
