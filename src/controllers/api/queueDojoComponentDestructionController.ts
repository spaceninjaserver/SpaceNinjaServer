import { config } from "@/src/services/configService";
import { getDojoClient, getGuildForRequestEx, hasAccessToDojo, hasGuildPermission } from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
import { RequestHandler } from "express";

export const queueDojoComponentDestructionController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Architect))) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }
    const componentId = req.query.componentId as string;

    guild.DojoComponents.id(componentId)!.DestructionTime = new Date(
        Date.now() + (config.fastDojoRoomDestruction ? 5_000 : 2 * 3600_000)
    );

    await guild.save();
    res.json(await getDojoClient(guild, 0, componentId));
};
