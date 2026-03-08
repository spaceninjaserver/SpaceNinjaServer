import type { RequestHandler } from "express";
//import type { IOidWithLegacySupport } from "../../types/commonTypes.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getDojoClient, getGuildForRequestEx } from "../../services/guildService.ts";

export const changeDojoSpawnRoomController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id, "GuildId");
    const guild = await getGuildForRequestEx(req, inventory);
    if (guild.DojoComponents.length != 1) {
        res.status(400).end();
    }
    guild.DojoComponents[0].pf = "/Lotus/Levels/ClanDojo/DojoHall.level";
    await guild.save();
    res.json(await getDojoClient(guild, 0, undefined, account.BuildLabel));
};

/*interface IChangeDojoSpawnRoomRequest {
    SpawnComponent: {
        id: IOidWithLegacySupport;
        pf: "/Lotus/Levels/ClanDojo/DojoHall.level";
        ppf?: "";
    };
}*/
