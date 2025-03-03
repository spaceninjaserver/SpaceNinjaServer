import { getDojoClient, getGuildForRequestEx } from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const abortDojoComponentController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const guild = await getGuildForRequestEx(req, inventory);
    const request = JSON.parse(String(req.body)) as IAbortDojoComponentRequest;
    // TODO: Move already-contributed credits & items to the clan vault
    guild.DojoComponents.pull({ _id: request.ComponentId });
    await guild.save();
    res.json(getDojoClient(guild, 0));
};

export interface IAbortDojoComponentRequest {
    ComponentId: string;
}
