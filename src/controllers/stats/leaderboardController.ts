import { getLeaderboard } from "../../services/leaderboardService.ts";
import type { RequestHandler } from "express";

export const leaderboardPostController: RequestHandler = async (req, res) => {
    const payload = JSON.parse(String(req.body)) as ILeaderboardRequest;
    res.json({
        results: await getLeaderboard(
            payload.field,
            payload.before,
            payload.after,
            payload.pivotId,
            payload.guildId,
            payload.guildTier
        )
    });
};

export const leaderboardU10Controller: RequestHandler = async (req, res) => {
    let guildTier: number | undefined;
    if ("guildTier" in req.query) {
        guildTier = parseInt(req.query.guildTier as string);
    }
    res.json({
        results: await getLeaderboard(
            req.query.field as string,
            parseInt(req.query.before as string),
            parseInt(req.query.after as string),
            req.query.pivotId as string | undefined,
            req.query.guildId as string | undefined,
            guildTier
        )
    });
};

export const leaderboardGetController: RequestHandler = async (req, res) => {
    const payload: ILeaderboardRequest = {
        field: "archived." + String(req.query.field),
        before: Number(req.query.before),
        after: Number(req.query.after),
        pivotId: req.query.pivotAccountId ? String(req.query.pivotAccountId) : undefined,
        guildId: undefined,
        guildTier: undefined
    };
    res.json({
        players: (
            await getLeaderboard(
                payload.field,
                payload.before,
                payload.after,
                payload.pivotId,
                payload.guildId,
                payload.guildTier
            )
        ).map(entry => ({
            DisplayName: entry.n,
            score: entry.s,
            rank: entry.r
        }))
    });
};

interface ILeaderboardRequest {
    field: string;
    before: number;
    after: number;
    pivotId?: string;
    guildId?: string;
    guildTier?: number;
}
