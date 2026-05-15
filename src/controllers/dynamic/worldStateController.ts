import type { RequestHandler } from "express";
import {
    getWorldState,
    populateDailyDeal,
    populateFeaturedGuilds,
    populateFissures
} from "../../services/worldStateService.ts";
import {
    getAccountForRequest,
    getBuildLabel,
    getBuildLabelForUnauthenticatedRequest
} from "../../services/loginService.ts";

export const worldStateController: RequestHandler = async (req, res) => {
    let buildLabel: string;
    if (req.query.accountId && !req.query.buildLabel) {
        const account = await getAccountForRequest(req);
        buildLabel = getBuildLabel(req, account);
    } else {
        buildLabel = getBuildLabelForUnauthenticatedRequest(req);
    }

    const worldState = getWorldState(buildLabel);

    await Promise.all([
        populateDailyDeal(worldState),
        populateFeaturedGuilds(worldState),
        populateFissures(worldState)
    ]);

    if (req.query.l) {
        for (const event of worldState.Events) {
            const msg = event.Messages.find(x => x.LanguageCode == req.query.l)?.Message ?? event.Msg;
            if (msg) {
                event.Messages = [{ Message: msg }];
            }
        }
    }

    res.json(worldState);
};
