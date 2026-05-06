import {
    getDojoClient,
    getGuildForRequestEx,
    hasAccessToDojo,
    hasGuildPermission,
    hasPermissionToDecorateComponent,
    removeDojoDeco,
    removeVaultPendingRecipe,
    removeDojoRoom
} from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { GuildPermission, type IDojoClient } from "../../types/guildTypes.ts";
import type { Request, RequestHandler } from "express";

export const abortDojoComponentGetController: RequestHandler = async (req, res) => {
    res.json(await abortDojoComponent(req, req.query.componentId as string, req.query.decoId as string | undefined));
};

export const abortDojoComponentPostController: RequestHandler = async (req, res) => {
    const request = JSON.parse(String(req.body)) as IAbortDojoComponentRequest;
    res.json(await abortDojoComponent(req, request.ComponentId, request.DecoId, request.ResultType));
};

const abortDojoComponent = async (
    req: Request,
    componentId: string,
    decoId?: string,
    resultType?: string
): Promise<{ DojoRequestStatus: number } | IDojoClient> => {
    const account = await getAccountForRequest(req);
    const accountId = account._id.toString();
    const inventory = await getInventory(accountId, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);

    if (resultType) {
        if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Tactician))) {
            return { DojoRequestStatus: -1 };
        }

        removeVaultPendingRecipe(guild, componentId, resultType);
        await guild.save();
        return await getDojoClient(guild, 0, undefined, account.BuildLabel);
    } else if (decoId) {
        if (!hasAccessToDojo(inventory) || !(await hasPermissionToDecorateComponent(guild, accountId, componentId))) {
            return { DojoRequestStatus: -1 };
        }

        removeDojoDeco(guild, componentId, decoId);
        await guild.save();
        return await getDojoClient(guild, 0, componentId, account.BuildLabel);
    } else {
        if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Architect))) {
            return { DojoRequestStatus: -1 };
        }

        removeDojoRoom(guild, componentId);
        await guild.save();
        return await getDojoClient(guild, 0, undefined, account.BuildLabel);
    }
};

interface IAbortDojoComponentRequest {
    DecoType?: string;
    ComponentId: string;
    DecoId?: string;
    ResultType?: string;
}
