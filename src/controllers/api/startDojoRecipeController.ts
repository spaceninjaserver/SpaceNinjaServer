import { RequestHandler } from "express";
import { IDojoComponentClient } from "@/src/types/guildTypes";
import { getDojoClient, getGuildForRequest, processDojoBuildMaterialsGathered } from "@/src/services/guildService";
import { Types } from "mongoose";
import { ExportDojoRecipes } from "warframe-public-export-plus";
import { config } from "@/src/services/configService";

interface IStartDojoRecipeRequest {
    PlacedComponent: IDojoComponentClient;
    Revision: number;
}

export const startDojoRecipeController: RequestHandler = async (req, res) => {
    const guild = await getGuildForRequest(req);
    // At this point, we know that a member of the guild is making this request. Assuming they are allowed to start a build.
    const request = JSON.parse(String(req.body)) as IStartDojoRecipeRequest;

    const room = Object.values(ExportDojoRecipes.rooms).find(x => x.resultType == request.PlacedComponent.pf);
    if (room) {
        guild.DojoCapacity += room.capacity;
        guild.DojoEnergy += room.energy;
    }

    const component =
        guild.DojoComponents[
            guild.DojoComponents.push({
                _id: new Types.ObjectId(),
                pf: request.PlacedComponent.pf,
                ppf: request.PlacedComponent.ppf,
                pi: new Types.ObjectId(request.PlacedComponent.pi!.$oid),
                op: request.PlacedComponent.op,
                pp: request.PlacedComponent.pp,
                DecoCapacity: room?.decoCapacity
            }) - 1
        ];
    if (config.noDojoRoomBuildStage) {
        component.CompletionTime = new Date(Date.now());
        if (room) {
            processDojoBuildMaterialsGathered(guild, room);
        }
    }
    await guild.save();
    res.json(await getDojoClient(guild, 0));
};
