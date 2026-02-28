import type { RequestHandler } from "express";
import { getDojoClient, getGuildForRequestEx } from "../../services/guildService.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";

export const setDojoComponentMessageController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id.toString(), "GuildId");
    const guild = await getGuildForRequestEx(req, inventory);
    // At this point, we know that a member of the guild is making this request. Assuming they are allowed to change the message.
    const component = guild.DojoComponents.id(req.query.componentId as string)!;
    const payload = JSON.parse(String(req.body)) as SetDojoComponentMessageRequest;
    if ("Name" in payload) {
        component.Name = payload.Name;
    } else {
        component.Message = payload.Message;
    }
    await guild.save();
    res.json(await getDojoClient(guild, 0, component._id, account.BuildLabel));
};

type SetDojoComponentMessageRequest = { Name: string } | { Message: string };
