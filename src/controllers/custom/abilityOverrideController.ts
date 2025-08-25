import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { TEquipmentKey } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";

export const abilityOverrideController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = req.body as IAbilityOverrideRequest;
    if (request.category === "Suits") {
        const inventory = await getInventory(accountId, request.category);
        const item = inventory[request.category].id(request.oid);
        if (item) {
            if (request.action == "set") {
                item.Configs[request.configIndex].AbilityOverride = request.AbilityOverride;
            } else {
                item.Configs[request.configIndex].AbilityOverride = undefined;
            }
            await inventory.save();
        }
    }
    res.end();
};

interface IAbilityOverrideRequest {
    category: TEquipmentKey;
    oid: string;
    action: "set" | "remove";
    configIndex: number;
    AbilityOverride: {
        Ability: string;
        Index: number;
    };
}
