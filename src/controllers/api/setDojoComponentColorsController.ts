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

export const setDojoComponentColorsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Decorator))) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }
    const data = getJSONfromString<ISetDojoComponentColorsRequest>(String(req.body));
    const component = guild.DojoComponents.id(data.ComponentId)!;
    //const deco = component.Decos!.find(x => x._id.equals(data.DecoId))!;
    //deco.Pending = true;
    //component.PaintBot = new Types.ObjectId(data.DecoId);
    if ("lights" in req.query) {
        component.PendingLights = data.Colours;
    } else {
        component.PendingColors = data.Colours;
    }
    await guild.save();
    res.json(await getDojoClient(guild, 0, component._id));
};

interface ISetDojoComponentColorsRequest {
    ComponentId: string;
    DecoId: string;
    Colours: number[];
}
