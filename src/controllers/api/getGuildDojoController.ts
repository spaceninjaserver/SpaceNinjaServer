import { RequestHandler } from "express";
import { Types } from "mongoose";
import { Guild } from "@/src/models/guildModel";
import { IDojoClient, IDojoComponentClient } from "@/src/types/guildTypes";
import { toOid, toMongoDate } from "@/src/helpers/inventoryHelpers";

export const getGuildDojoController: RequestHandler = async (req, res) => {
    const guildId = req.query.guildId as string;

    const guild = await Guild.findOne({ _id: guildId });
    if (!guild) {
        res.status(404).end();
        return;
    }

    // Populate dojo info if not present
    if (!guild.DojoComponents || guild.DojoComponents.length == 0) {
        guild.DojoComponents = [
            {
                _id: new Types.ObjectId(),
                pf: "/Lotus/Levels/ClanDojo/DojoHall.level",
                ppf: "",
                CompletionTime: new Date(Date.now())
            }
        ];
        await guild.save();
    }

    const dojo: IDojoClient = {
        _id: { $oid: guildId },
        Name: guild.Name,
        Tier: 1,
        FixedContributions: true,
        DojoRevision: 1,
        RevisionTime: Math.round(Date.now() / 1000),
        Energy: guild.DojoEnergy,
        Capacity: guild.DojoCapacity,
        DojoRequestStatus: 0,
        DojoComponents: []
    };
    guild.DojoComponents.forEach(dojoComponent => {
        const clientComponent: IDojoComponentClient = {
            id: toOid(dojoComponent._id),
            pf: dojoComponent.pf,
            ppf: dojoComponent.ppf,
            DecoCapacity: 600
        };
        if (dojoComponent.pi) {
            clientComponent.pi = toOid(dojoComponent.pi);
            clientComponent.op = dojoComponent.op!;
            clientComponent.pp = dojoComponent.pp!;
        }
        if (dojoComponent.CompletionTime) {
            clientComponent.CompletionTime = toMongoDate(dojoComponent.CompletionTime);
        }
        dojo.DojoComponents.push(clientComponent);
    });
    res.json(dojo);
};
