import {
    getDojoClient,
    getGuildForRequestEx,
    hasAccessToDojo,
    hasGuildPermission,
    removeDojoDeco,
    removeDojoRoom
} from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
import { RequestHandler } from "express";

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
    } else {
        await removeDojoRoom(guild, request.ComponentId);
    }

    await guild.save();
    res.json(await getDojoClient(guild, 0, request.ComponentId));
};

interface IAbortDojoComponentRequest {
    DecoType?: string;
    ComponentId: string;
    DecoId?: string;
}
