import type { RequestHandler } from "express";
//import type { IOidWithLegacySupport } from "../../types/commonTypes.ts";
import { Types } from "mongoose";
import { getDojoClient, getGuildForRequest } from "../../services/guildService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";

export const createGuildDojoController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const guild = await getGuildForRequest(req, account._id);

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

    res.json(await getDojoClient(guild, 0, undefined, buildLabel));
};

interface ICreateGuildDojoRequest {
    SpawnComponent: {
        //id: IOidWithLegacySupport; // all zeroes or empty string
        pf: string; // "/Lotus/Levels/ClanDojo/DojoHall.level" nowadays, but "/Lotus/Levels/ClanDojo/ClanHallA.level" before U9.5
        //ppf?: ""; // not given in U8, and empty string in modern versions
    };
}
