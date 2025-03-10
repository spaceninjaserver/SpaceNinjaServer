import { config } from "@/src/services/configService";
import { getDojoClient, getGuildForRequest } from "@/src/services/guildService";
import { RequestHandler } from "express";

export const queueDojoComponentDestructionController: RequestHandler = async (req, res) => {
    const guild = await getGuildForRequest(req);
    const componentId = req.query.componentId as string;

    guild.DojoComponents.id(componentId)!.DestructionTime = new Date(
        Date.now() + (config.fastDojoRoomDestruction ? 5_000 : 2 * 3600_000)
    );

    await guild.save();
    res.json(await getDojoClient(guild, 0, componentId));
};
