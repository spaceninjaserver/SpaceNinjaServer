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
