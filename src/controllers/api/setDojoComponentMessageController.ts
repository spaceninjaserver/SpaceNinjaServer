import { RequestHandler } from "express";
import { getDojoClient, getGuildForRequest } from "@/src/services/guildService";

export const setDojoComponentMessageController: RequestHandler = async (req, res) => {
    const guild = await getGuildForRequest(req);
    // At this point, we know that a member of the guild is making this request. Assuming they are allowed to change the message.
    const component = guild.DojoComponents.id(req.query.componentId as string)!;
    const payload = JSON.parse(String(req.body)) as SetDojoComponentMessageRequest;
    if ("Name" in payload) {
        component.Name = payload.Name;
    } else {
        component.Message = payload.Message;
    }
    await guild.save();
    res.json(getDojoClient(guild, 1));
};

type SetDojoComponentMessageRequest = { Name: string } | { Message: string };
