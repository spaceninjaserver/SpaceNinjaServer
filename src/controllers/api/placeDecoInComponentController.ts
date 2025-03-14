import { getDojoClient, getGuildForRequestEx, hasAccessToDojo, hasGuildPermission } from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
import { RequestHandler } from "express";
import { Types } from "mongoose";
import { ExportDojoRecipes } from "warframe-public-export-plus";

export const placeDecoInComponentController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Decorator))) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }
    const request = JSON.parse(String(req.body)) as IPlaceDecoInComponentRequest;
    const component = guild.DojoComponents.id(request.ComponentId)!;

    if (component.DecoCapacity === undefined) {
        component.DecoCapacity = Object.values(ExportDojoRecipes.rooms).find(
            x => x.resultType == component.pf
        )!.decoCapacity;
    }

    component.Decos ??= [];
    component.Decos.push({
        _id: new Types.ObjectId(),
        Type: request.Type,
        Pos: request.Pos,
        Rot: request.Rot,
        Name: request.Name
    });

    const meta = Object.values(ExportDojoRecipes.decos).find(x => x.resultType == request.Type);
    if (meta && meta.capacityCost) {
        component.DecoCapacity -= meta.capacityCost;
    }

    await guild.save();
    res.json(await getDojoClient(guild, 0, component._id));
};

interface IPlaceDecoInComponentRequest {
    ComponentId: string;
    Revision: number;
    Type: string;
    Pos: number[];
    Rot: number[];
    Name?: string;
}
