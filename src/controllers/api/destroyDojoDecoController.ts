import {
    getDojoClient,
    getGuildForRequestEx,
    hasAccessToDojo,
    hasPermissionToDecorateComponent,
    refundDojoDeco,
    removeDojoDeco
} from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { logger } from "../../utils/logger.ts";
import type { RequestHandler } from "express";

export const destroyDojoDecoController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    const request = JSON.parse(String(req.body)) as IDestroyDojoDecoRequest | IClearObstacleCourseRequest;
    if (
        !hasAccessToDojo(inventory) ||
        !(await hasPermissionToDecorateComponent(guild, account._id.toString(), request.ComponentId))
    ) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }
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
    const buildLabel = getBuildLabel(req, account);
    res.json(await getDojoClient(guild, 0, request.ComponentId, buildLabel));
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
