import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import {
    getDojoClient,
    getGuildForRequestEx,
    hasAccessToDojo,
    hasGuildPermission
} from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";

export const setDojoComponentSettingsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Decorator))) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }
    const component = guild.DojoComponents.id(req.query.componentId as string)!;
    const data = getJSONfromString<ISetDojoComponentSettingsRequest>(String(req.body));
    component.Settings = data.Settings;
    await guild.save();
    res.json(await getDojoClient(guild, 0, component._id));
};

interface ISetDojoComponentSettingsRequest {
    Settings: string;
}
