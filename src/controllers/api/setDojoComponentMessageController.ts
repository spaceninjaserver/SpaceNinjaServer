import type { RequestHandler } from "express";
import { getDojoClient, getGuildForRequest } from "../../services/guildService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";

export const setDojoComponentMessageController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const guild = await getGuildForRequest(req, account._id);
    // At this point, we know that a member of the guild is making this request. Assuming they are allowed to change the message.
    const component = guild.DojoComponents.id(req.query.componentId as string)!;
    const payload = JSON.parse(String(req.body)) as SetDojoComponentMessageRequest;
    if ("Name" in payload) {
        component.Name = payload.Name;
    } else {
        component.Message = payload.Message;
    }
    await guild.save();
    const buildLabel = getBuildLabel(req, account);
    res.json(await getDojoClient(guild, 0, component._id, buildLabel));
};

type SetDojoComponentMessageRequest = { Name: string } | { Message: string };
