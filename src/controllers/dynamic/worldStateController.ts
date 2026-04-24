import type { RequestHandler } from "express";
import {
    getWorldState,
    populateDailyDeal,
    populateFeaturedGuilds,
    populateFissures
} from "../../services/worldStateService.ts";
import { getAccountForRequest } from "../../services/loginService.ts";

export const worldStateController: RequestHandler = async (req, res) => {
    let buildLabel = req.query.buildLabel as string | undefined;
    if (buildLabel) {
        buildLabel = buildLabel.replaceAll(" ", "+");
    } else if (req.query.accountId) {
        const account = await getAccountForRequest(req);
        buildLabel = account.BuildLabel;
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
