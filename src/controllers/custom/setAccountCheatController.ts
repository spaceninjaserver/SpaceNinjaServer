import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IAccountCheats } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";

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
