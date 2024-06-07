import { getGuildForRequest } from "@/src/services/guildService";
import { RequestHandler } from "express";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const queueDojoComponentDestructionController: RequestHandler = async (req, res) => {
    const guild = await getGuildForRequest(req);
    const componentId = req.query.componentId as string;
    guild.DojoComponents!.splice(
        guild.DojoComponents!.findIndex(x => x._id.toString() === componentId),
        1
    );
    await guild.save();
    res.json({
        DojoRequestStatus: 1
    });
};
