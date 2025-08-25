import type { RequestHandler } from "express";
import type { IDojoComponentClient } from "@/src/types/guildTypes";
import { GuildPermission } from "@/src/types/guildTypes";
import {
    getDojoClient,
    getGuildForRequestEx,
    hasAccessToDojo,
    hasGuildPermission,
    processDojoBuildMaterialsGathered,
    setDojoRoomLogFunded
} from "@/src/services/guildService";
import { Types } from "mongoose";
import { ExportDojoRecipes } from "warframe-public-export-plus";
import { config } from "@/src/services/configService";
import { getAccountForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";

interface IStartDojoRecipeRequest {
    PlacedComponent: IDojoComponentClient;
    Revision: number;
}

export const startDojoRecipeController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id.toString(), "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, account._id, GuildPermission.Architect))) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }
    const request = JSON.parse(String(req.body)) as IStartDojoRecipeRequest;

    const room = Object.values(ExportDojoRecipes.rooms).find(x => x.resultType == request.PlacedComponent.pf);
    if (room) {
        guild.DojoCapacity += room.capacity;
        guild.DojoEnergy += room.energy;
    }

    const componentId = new Types.ObjectId();

    guild.RoomChanges ??= [];
    guild.RoomChanges.push({
        entryType: 2,
        details: request.PlacedComponent.pf,
        componentId: componentId
    });

    const component =
        guild.DojoComponents[
            guild.DojoComponents.push({
                _id: componentId,
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
        setDojoRoomLogFunded(guild, component);
    }
    await guild.save();
    res.json(await getDojoClient(guild, 0, undefined, account.BuildLabel));
};
