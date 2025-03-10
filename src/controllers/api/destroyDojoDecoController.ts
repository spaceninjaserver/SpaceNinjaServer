import { getDojoClient, getGuildForRequest, removeDojoDeco } from "@/src/services/guildService";
import { RequestHandler } from "express";

export const destroyDojoDecoController: RequestHandler = async (req, res) => {
    const guild = await getGuildForRequest(req);
    const request = JSON.parse(String(req.body)) as IDestroyDojoDecoRequest;

    removeDojoDeco(guild, request.ComponentId, request.DecoId);

    await guild.save();
    res.json(await getDojoClient(guild, 0, request.ComponentId));
};

interface IDestroyDojoDecoRequest {
    DecoType: string;
    ComponentId: string;
    DecoId: string;
}
