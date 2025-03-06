import { getDojoClient, getGuildForRequest, removeDojoRoom } from "@/src/services/guildService";
import { RequestHandler } from "express";

export const queueDojoComponentDestructionController: RequestHandler = async (req, res) => {
    const guild = await getGuildForRequest(req);
    const componentId = req.query.componentId as string;

    removeDojoRoom(guild, componentId);

    await guild.save();
    res.json(getDojoClient(guild, 1));
};
