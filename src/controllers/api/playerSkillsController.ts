import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addConsumables, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IPlayerSkills } from "@/src/types/inventoryTypes/inventoryTypes";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { RequestHandler } from "express";

export const playerSkillsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "PlayerSkills Consumables");
    const request = getJSONfromString<IPlayerSkillsRequest>(String(req.body));

    const oldRank: number = inventory.PlayerSkills[request.Skill as keyof IPlayerSkills];
    const cost = (request.Pool == "LPP_DRIFTER" ? drifterCosts[oldRank] : 1 << oldRank) * 1000;
    inventory.PlayerSkills[request.Pool as keyof IPlayerSkills] -= cost;
    inventory.PlayerSkills[request.Skill as keyof IPlayerSkills]++;

    const inventoryChanges: IInventoryChanges = {};
    if (request.Skill == "LPS_COMMAND") {
        if (inventory.PlayerSkills.LPS_COMMAND == 9) {
            const consumablesChanges = [
                {
                    ItemType: "/Lotus/Types/Restoratives/Consumable/CrewmateBall",
                    ItemCount: 1
                }
            ];
            addConsumables(inventory, consumablesChanges);
            inventoryChanges.Consumables = consumablesChanges;
        }
    } else if (request.Skill == "LPS_DRIFT_RIDING") {
        if (inventory.PlayerSkills.LPS_DRIFT_RIDING == 9) {
            const consumablesChanges = [
                {
                    ItemType: "/Lotus/Types/Restoratives/ErsatzSummon",
                    ItemCount: 1
                }
            ];
            addConsumables(inventory, consumablesChanges);
            inventoryChanges.Consumables = consumablesChanges;
        }
    }

    await inventory.save();
    res.json({
        Pool: request.Pool,
        PoolInc: -cost,
        Skill: request.Skill,
        Rank: oldRank + 1,
        InventoryChanges: inventoryChanges
    });
};

interface IPlayerSkillsRequest {
    Pool: string;
    Skill: string;
}

const drifterCosts = [20, 25, 30, 45, 65, 90, 125, 160, 205, 255];
