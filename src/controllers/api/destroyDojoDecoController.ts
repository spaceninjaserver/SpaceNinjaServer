import {
    getDojoClient,
    getGuildForRequestEx,
    hasAccessToDojo,
    hasGuildPermission,
    refundDojoDeco,
    removeDojoDeco
} from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";

export const destroyDojoDecoController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Decorator))) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }
    const request = JSON.parse(String(req.body)) as IDestroyDojoDecoRequest | IClearObstacleCourseRequest;
    if ("DecoType" in request) {
        removeDojoDeco(guild, request.ComponentId, request.DecoId);
    } else if (request.Act == "cObst") {
        const component = guild.DojoComponents.id(request.ComponentId)!;
        if (component.Decos) {
            for (const deco of component.Decos) {
                refundDojoDeco(guild, component, deco);
            }
            component.Decos.splice(0, component.Decos.length);
        }
    } else {
        logger.error(`unhandled destroyDojoDeco request`, request);
    }

    await guild.save();
    res.json(await getDojoClient(guild, 0, request.ComponentId));
};

interface IDestroyDojoDecoRequest {
    DecoType: string;
    ComponentId: string;
    DecoId: string;
}

interface IClearObstacleCourseRequest {
    ComponentId: string;
    Act: "cObst" | "maybesomethingelsewedontknowabout";
}
