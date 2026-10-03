import type { RequestHandler } from "express";
import { getAccountForRequest, isAdministrator } from "../../services/loginService.ts";
import { IceBladeChampion } from "../../models/worldStateModel.ts";
import { Inbox } from "../../models/inboxModel.ts";

export const resetIceBladeChampionController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!isAdministrator(account)) {
        res.status(401).end();
        return;
    }

    await Promise.all([
        IceBladeChampion.deleteMany({}),
        Inbox.deleteMany({ sub: "/Lotus/Language/Iceblade/IcebladeChallengeInboxSubject" })
    ]);
    res.end();
};
