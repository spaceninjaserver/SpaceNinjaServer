import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";
import { getNightwaveSyndicateTag, nightwaveTagToSeason } from "../../services/worldStateService.ts";
import { config } from "../../services/configService.ts";
import { buildVersionToInt } from "../../helpers/versionHelper.ts";
import { BV_LATEST } from "../../constants/gameVersions.ts";

export const getNightwaveTagController: RequestHandler = async (req, res) => {
    const override = config.worldState?.nightwaveOverride;
    if (override && override in nightwaveTagToSeason) {
        res.json(override);
        return;
    }
    const account = await getAccountForRequest(req);
    const buildVersion = account.BuildLabel ? buildVersionToInt(account.BuildLabel) : BV_LATEST;
    res.json(getNightwaveSyndicateTag(buildVersion) ?? null);
};
