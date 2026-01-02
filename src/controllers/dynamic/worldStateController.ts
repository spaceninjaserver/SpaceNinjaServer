import type { RequestHandler } from "express";
import {
    getWorldState,
    populateDailyDeal,
    populateFeaturedGuilds,
    populateFissures
} from "../../services/worldStateService.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";

export const worldStateController: RequestHandler = async (req, res) => {
    const buildLabel = req.query.buildLabel as string | undefined;
    const worldState = getWorldState(buildLabel);

    const populatePromises = [populateDailyDeal(worldState), populateFeaturedGuilds(worldState)];

    // Omitting void fissures for versions prior to Dante Unbound to avoid script errors.
    if (!buildLabel || version_compare(buildLabel, gameToBuildVersion["35.5.0"]) >= 0) {
        populatePromises.push(populateFissures(worldState));
    }

    await Promise.all(populatePromises);

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
