import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getDojoClient, getGuildForRequestEx, hasAccessToDojo, hasGuildPermission } from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
import { RequestHandler } from "express";

export const setDojoComponentSettingsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Decorator))) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }
    const component = guild.DojoComponents.id(req.query.componentId)!;
    const data = getJSONfromString<ISetDojoComponentSettingsRequest>(String(req.body));
    component.Settings = data.Settings;
    await guild.save();
    res.json(await getDojoClient(guild, 0, component._id));
};

interface ISetDojoComponentSettingsRequest {
    Settings: string;
}
