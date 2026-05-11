import type { RequestHandler } from "express";
//import type { IOidWithLegacySupport } from "../../types/commonTypes.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { getDojoClient, getGuildForRequest } from "../../services/guildService.ts";

export const changeDojoSpawnRoomController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const guild = await getGuildForRequest(req, account._id);
    if (guild.DojoComponents.length != 1) {
        res.status(400).end();
    }
    guild.DojoComponents[0].pf = "/Lotus/Levels/ClanDojo/DojoHall.level";
    await guild.save();
    const buildLabel = getBuildLabel(req, account);
    res.json(await getDojoClient(guild, 0, undefined, buildLabel));
};

/*interface IChangeDojoSpawnRoomRequest {
    SpawnComponent: {
        id: IOidWithLegacySupport;
        pf: "/Lotus/Levels/ClanDojo/DojoHall.level";
        ppf?: "";
    };
}*/
