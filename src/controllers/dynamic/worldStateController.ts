import type { RequestHandler } from "express";
import {
    getWorldState,
    populateDailyDeal,
    populateFeaturedGuilds,
    populateFissures
} from "../../services/worldStateService.ts";
import { buildConfig } from "../../services/buildConfigService.ts";

export const worldStateController: RequestHandler = async (req, res) => {
    let buildLabel = req.query.buildLabel as string | undefined;
    // For /cdn/worldState.php, keep buildLabel=undefined to mean latest,
    // but for /dynamic/worldState.php, we might be dealing with a U5 client, so grab buildLabel from buildConfig, instead.
    if (!buildLabel && req.originalUrl == "/dynamic/worldState.php") {
        buildLabel = buildConfig.buildLabel;
    }

    const worldState = getWorldState(buildLabel);

    await Promise.all([
        populateDailyDeal(worldState),
        populateFeaturedGuilds(worldState),
        populateFissures(worldState)
    ]);

    if (req.query.l && worldState.Events) {
        for (const event of worldState.Events) {
            const msg = event.Messages.find(x => x.LanguageCode == req.query.l)?.Message ?? event.Msg;
            if (msg) {
                event.Messages = [{ Message: msg }];
            }
        }
    }

    res.json(worldState);
};
