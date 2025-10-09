import {
    getDojoClient,
    getGuildForRequestEx,
    hasAccessToDojo,
    hasGuildPermission,
    removeDojoDeco,
    removeDojoRoom
} from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";

export const abortDojoComponentController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    const request = JSON.parse(String(req.body)) as IAbortDojoComponentRequest;

    if (
        !hasAccessToDojo(inventory) ||
        !(await hasGuildPermission(
            guild,
            accountId,
            request.DecoId ? GuildPermission.Decorator : GuildPermission.Architect
        ))
    ) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }

    if (request.DecoId) {
        removeDojoDeco(guild, request.ComponentId, request.DecoId);
        await guild.save();
        res.json(await getDojoClient(guild, 0, request.ComponentId));
    } else {
        await removeDojoRoom(guild, request.ComponentId);
        await guild.save();
        res.json(await getDojoClient(guild, 0));
    }
};

interface IAbortDojoComponentRequest {
    DecoType?: string;
    ComponentId: string;
    DecoId?: string;
}
