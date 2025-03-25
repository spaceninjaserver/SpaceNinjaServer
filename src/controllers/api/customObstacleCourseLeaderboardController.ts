import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Guild } from "@/src/models/guildModel";
import { getAccountForRequest } from "@/src/services/loginService";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";

export const customObstacleCourseLeaderboardController: RequestHandler = async (req, res) => {
    const data = getJSONfromString<ICustomObstacleCourseLeaderboardRequest>(String(req.body));
    const guild = (await Guild.findById(data.g, "DojoComponents"))!;
    const component = guild.DojoComponents.id(data.c)!;
    if (req.query.act == "f") {
        res.json({
            results: component.Leaderboard ?? []
        });
    } else if (req.query.act == "p") {
        const account = await getAccountForRequest(req);
        component.Leaderboard ??= [];
        const entry = component.Leaderboard.find(x => x.n == account.DisplayName);
        if (entry) {
            entry.s = data.s!;
        } else {
            component.Leaderboard.push({
                s: data.s!,
                n: account.DisplayName,
                r: 0
            });
        }
        component.Leaderboard.sort((a, b) => a.s - b.s); // In this case, the score is the time in milliseconds, so smaller is better.
        if (component.Leaderboard.length > 10) {
            component.Leaderboard.shift();
        }
        let r = 0;
        for (const entry of component.Leaderboard) {
            entry.r = ++r;
        }
        await guild.save();
        res.status(200).end();
    } else {
        logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
        throw new Error(`unknown customObstacleCourseLeaderboard act: ${String(req.query.act)}`);
    }
};

interface ICustomObstacleCourseLeaderboardRequest {
    g: string;
    c: string;
    s?: number; // act=p
}
