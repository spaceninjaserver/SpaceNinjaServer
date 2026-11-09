import type { RequestHandler } from "express";
import { getAccountForRequest, isAdministrator } from "../../services/loginService.ts";
import { Guild } from "../../models/guildModel.ts";
import { sendWsBroadcast } from "../../services/wsService.ts";
import type { IDbListData, TDbListUpdate } from "../../types/webuiTypes.ts";
import { areFeaturedGuildLimitsRespected, isSpecialIcon } from "../../helpers/featuredGuildHelper.ts";

export const getFeaturedGuildsController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!isAdministrator(account)) {
        res.status(401).end();
        return;
    }

    const guilds = await Guild.find({}, "Name Featured FeaturedIcon").sort({ _id: 1 });
    const data: IDbListData = {
        names: guilds.map(guild => guild.Name).sort(),
        entries: guilds
            .filter(guild => guild.Featured)
            .map(guild => ({
                name: guild.Name,
                value: String(guild.FeaturedIcon ?? 0)
            }))
    };
    res.json(data);
};

export const setFeaturedGuildController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!isAdministrator(account)) {
        res.status(401).end();
        return;
    }

    const payload = req.body as TDbListUpdate;
    const target = await Guild.findOne({ Name: payload.name }, "_id");
    if (!target) {
        res.status(404).end();
        return;
    }

    if ("remove" in payload) {
        await Guild.updateOne({ _id: target._id }, { $unset: { Featured: 1, FeaturedIcon: 1 } });
    } else {
        const icon = parseInt(payload.value ?? "0") || undefined;
        const featured = await Guild.find({ Featured: true, _id: { $ne: target._id } }, "_id FeaturedIcon");
        const entries = [
            ...featured.map(guild => ({ id: guild._id, icon: guild.FeaturedIcon })),
            { id: target._id, icon }
        ].sort((a, b) => a.id.toString().localeCompare(b.id.toString()));

        if (!areFeaturedGuildLimitsRespected(entries)) {
            const iconTaken = isSpecialIcon(icon) && featured.some(guild => guild.FeaturedIcon == icon);
            res.status(409).send(iconTaken ? "code_featuredDojoIconTaken" : "code_featuredDojoLimit");
            return;
        }

        await Guild.updateOne(
            { _id: target._id },
            icon ? { Featured: true, FeaturedIcon: icon } : { Featured: true, $unset: { FeaturedIcon: 1 } }
        );
    }
    sendWsBroadcast({ sync_world_state: true });
    res.end();
};
