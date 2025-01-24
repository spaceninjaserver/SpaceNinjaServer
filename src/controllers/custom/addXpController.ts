import { addGearExpByCategory, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IEquipmentClient } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";

export const addXpController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const request = req.body as IAddXpRequest;
    for (const [category, gear] of Object.entries(request)) {
        addGearExpByCategory(inventory, gear, category as TEquipmentKey);
    }
    await inventory.save();
    res.end();
};

type IAddXpRequest = {
    [_ in TEquipmentKey]: IEquipmentClient[];
};
