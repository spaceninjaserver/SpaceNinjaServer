import { RequestHandler } from "express";
import { IDojoComponentClient } from "@/src/types/guildTypes";
import { getGuildForRequest } from "@/src/services/guildService";
import { Types } from "mongoose";

interface IStartDojoRecipeRequest {
    PlacedComponent: IDojoComponentClient;
    Revision: number;
}

export const startDojoRecipeController: RequestHandler = async (req, res) => {
    const guild = await getGuildForRequest(req);
    // At this point, we know that a member of the guild is making this request. Assuming they are allowed to start a build.
    const request = JSON.parse(req.body.toString()) as IStartDojoRecipeRequest;
    guild.DojoComponents!.push({
        _id: new Types.ObjectId(),
        pf: request.PlacedComponent.pf,
        ppf: request.PlacedComponent.ppf,
        pi: new Types.ObjectId(request.PlacedComponent.pi!.$oid),
        op: request.PlacedComponent.op,
        pp: request.PlacedComponent.pp,
        CompletionTime: new Date(Date.now()) // TOOD: Omit this field & handle the "Collecting Materials" state.
    });
    await guild.save();
    res.json({
        DojoRequestStatus: 0
    });
};
