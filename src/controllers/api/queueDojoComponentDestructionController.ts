import { getGuildForRequest } from "@/src/services/guildService";
import { RequestHandler } from "express";
import { ExportDojoRecipes } from "warframe-public-export-plus";

export const queueDojoComponentDestructionController: RequestHandler = async (req, res) => {
    const guild = await getGuildForRequest(req);
    const componentId = req.query.componentId as string;
    const component = guild.DojoComponents!.splice(
        guild.DojoComponents!.findIndex(x => x._id.toString() === componentId),
        1
    )[0];
    if (component) {
        const room = Object.values(ExportDojoRecipes.rooms).find(x => x.resultType == component.pf);
        if (room) {
            guild.DojoCapacity -= room.capacity;
            guild.DojoEnergy -= room.energy;
        }
    }
    await guild.save();
    res.json({
        DojoRequestStatus: 1
    });
};
