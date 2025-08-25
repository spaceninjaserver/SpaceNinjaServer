import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getDojoClient, getGuildForRequestEx, hasAccessToDojo, hasGuildPermission } from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
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
