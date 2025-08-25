import { toMongoDate, toOid } from "../../helpers/inventoryHelpers.ts";
import { GuildAd } from "../../models/guildModel.ts";
import type { IGuildAdInfoClient } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";

export const getGuildAdsController: RequestHandler = async (req, res) => {
    const ads = await GuildAd.find(req.query.tier ? { Tier: req.query.tier } : {});
    const guildAdInfos: IGuildAdInfoClient[] = [];
    for (const ad of ads) {
        guildAdInfos.push({
            _id: toOid(ad.GuildId),
            CrossPlatformEnabled: true,
            Emblem: ad.Emblem,
            Expiry: toMongoDate(ad.Expiry),
            Features: ad.Features,
            GuildName: ad.GuildName,
            MemberCount: ad.MemberCount,
            OriginalPlatform: 0,
            RecruitMsg: ad.RecruitMsg,
            Tier: ad.Tier
        });
    }
    res.json({
        GuildAdInfos: guildAdInfos
    });
};
