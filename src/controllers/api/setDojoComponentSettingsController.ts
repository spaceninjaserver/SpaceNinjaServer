import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import {
    getDojoClient,
    getGuildForRequestEx,
    hasAccessToDojo,
    hasPermissionToDecorateComponent
} from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const setDojoComponentSettingsController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    const componentId = req.query.componentId as string;
    if (
        !hasAccessToDojo(inventory) ||
        !(await hasPermissionToDecorateComponent(guild, account._id.toString(), componentId))
    ) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }
    const component = guild.DojoComponents.id(componentId)!;
    const data = getJSONfromString<ISetDojoComponentSettingsRequest>(String(req.body));
    component.Settings = data.Settings;
    await guild.save();
    const buildLabel = getBuildLabel(req, account);
    res.json(await getDojoClient(guild, 0, component._id, buildLabel));
};

interface ISetDojoComponentSettingsRequest {
    Settings: string;
}
