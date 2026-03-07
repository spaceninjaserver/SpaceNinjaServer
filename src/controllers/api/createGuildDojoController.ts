import type { RequestHandler } from "express";
//import type { IOidWithLegacySupport } from "../../types/commonTypes.ts";
import { Types } from "mongoose";
import { getDojoClient, getGuildForRequestEx } from "../../services/guildService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";

export const createGuildDojoController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id.toString(), "GuildId");
    const guild = await getGuildForRequestEx(req, inventory);

    if (guild.DojoComponents.length == 0) {
        const payload = getJSONfromString<ICreateGuildDojoRequest>(String(req.body));
        guild.DojoComponents.push({
            _id: new Types.ObjectId(),
            pf: payload.SpawnComponent.pf,
            ppf: "",
            CompletionTime: new Date(Date.now() - 2000),
            DecoCapacity: 600
        });
        await guild.save();
    }

    res.json(await getDojoClient(guild, 0, undefined, account.BuildLabel));
};

interface ICreateGuildDojoRequest {
    SpawnComponent: {
        //id: IOidWithLegacySupport; // all zeroes or empty string
        pf: string; // "/Lotus/Levels/ClanDojo/DojoHall.level" nowadays, but "/Lotus/Levels/ClanDojo/ClanHallA.level" before U9.5
        //ppf?: ""; // not given in U8, and empty string in modern versions
    };
}
