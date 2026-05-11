import {
    getDojoClient,
    getGuildForRequestEx,
    hasAccessToDojo,
    hasGuildPermission
} from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { eGuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";

export const queueDojoComponentDestructionController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const inventory = await getInventory(account._id, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, account._id, eGuildPermission.Architect))) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }
    const componentId = req.query.componentId as string;

    guild.DojoComponents.id(componentId)!.DestructionTime = new Date(
        (Math.trunc(Date.now() / 1000) + (guild.fastDojoRoomDestruction ? 5 : 2 * 3600)) * 1000
    );

    await guild.save();
    res.json(await getDojoClient(guild, 0, componentId, buildLabel));
};
