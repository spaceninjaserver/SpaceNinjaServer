import { toMongoDate, toOid } from "@/src/helpers/inventoryHelpers";
import { GuildAd } from "@/src/models/guildModel";
import { IGuildAdInfoClient } from "@/src/types/guildTypes";
import { RequestHandler } from "express";

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
