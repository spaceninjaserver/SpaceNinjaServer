import { getDojoClient, getGuildForRequest } from "@/src/services/guildService";
import { RequestHandler } from "express";

export const abortDojoComponentDestructionController: RequestHandler = async (req, res) => {
    const guild = await getGuildForRequest(req);
    const componentId = req.query.componentId as string;

    guild.DojoComponents.id(componentId)!.DestructionTime = undefined;

    await guild.save();
    res.json(await getDojoClient(guild, 0, componentId));
};
