import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IAccountCheats } from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";

export const setAccountCheatController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = req.body as ISetAccountCheatRequest;
    const inventory = await getInventory(accountId, payload.key);
    inventory[payload.key] = payload.value;
    await inventory.save();
    res.end();
};

interface ISetAccountCheatRequest {
    key: keyof IAccountCheats;
    value: boolean;
}
